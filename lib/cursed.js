var parse = require('url').parse,
     http = require('http'),
      sys = require('sys'),
   child_process = require('child_process');

var cursed = exports;

cursed.Server      = require('./cursed/server').Server;
cursed.Connection  = require('./cursed/connection').Connection;
cursed.MockServer  = require('./cursed/mock_request').mock;

// ################################################

exports.Router = function (host, port) {
    cursed.Server.apply(this, arguments);
    this.routes = {};

    var that = this;

    this.commands.register = function(args, headers, reply) {
        if(typeof(args) != 'object') {
            reply.error('Invalid Arguments: Give me a route object');
            return
        }

        that.register_route(args);
        reply.emit('OK');
    }
    // tell a server where to go
    this.commands.route = function (args, headers, reply) {
        var route = that.find_route(args);
        if (route) {
            reply.emit(route);
        } else {
            reply.error('Route not found');
        }
    }
    this.commands.table = function (args, req, reply) {
        reply.emit(that.routing);
    }
}

cursed.Router.prototype = {
    run: function () {
        var current;
        // route the execution to the appropriate node
        queue.forEach(function (task) {
            //This is a stupid way to rotate
            current = this.workers[task[0]].shift();
            // umm, callbacks?
            current.call(task[1]);
            this.workers[task[0]].push();
        });
    },

    find_route: function (command) {
        // no route found
        if(!(command in this.routes)) return

        var lowest_weight = function (r1, r2) {
            return r1.weight - r2.weight;
        }

        var best_route = this.routes[command].sort(lowest_weight)[0];
        best_route.weight = best_route.weight + 1;

        return best_route;
    },

    register_route: function(route) {
        var new_route_node = { host: route.host, port: route.port, weight: 0 };
        var that = this;
        route.commands.forEach(function (command) {
            if(command in that.routes) {
                var compairable_route = that.routes[command].filter(function (other) {
                    return route.host == other.host && route.port == other.port;
                });
                if(compairable_route) return

                that.routes[command].push(new_route_node);
            } else {
                that.routes[command] = [new_route_node];
            }
        });
    },

    queue: function (job, args) {
        this._queue.push([job, args]);
    }
};

cursed.Router.prototype.__proto__ = cursed.Server.prototype;

// ################################################

cursed.Worker = function (host, port, task_module) {
    cursed.Server.apply(this, [host, port]);

    this.server.commands = require(task_module);
    this.commands = Object.keys(this.server.commands);
}

cursed.Worker.prototype.__proto__ = cursed.Server.prototype;

//A Collection of workers
cursed.Node = function (concurrency, task_module, host, port) {
    
    var that = this;
    var create_worker = function (host, port) {
        var child    = child_process.spawn('node', ['worker.js', host, port, task_module]);
        var commands = Object.keys(require(task_module));

        child.stdout.addListener('data', function (data) {
            log(data);
        });

        child.stderr.addListener('data', function (data) {
            log('ERROR: ' + data);
        });

        return { host: host, port: port, commands: commands }
    }

    // start a bunch of child processes
    this.workers = []
    for(var i =0; i < concurrency; i++) this.workers.push(create_worker(host, port + i));

    this.register = function (router, callback) {
        var count = 0;
        var failures = [];

        var register_cb = function(err, result) {
            count++;
            if(err) {
                failures.push(err);
            }

            if(count === concurrency){
                if(failures.length > 0){
                    callback(new(Error)('Failed to register one or many workers, ensure the router is up'));
                }else{
                    callback(null, this.workers);
                }
            }
        }
        this.workers.forEach(function (worker) {
            router.send('register', 
                { host: worker.host, port: worker.port, commands: worker.commands },
                register_cb);
        });

    }
}


// ##############################################

var log = function (msg) {
    sys.puts(msg);
}

var mixin = function (target) {
    var objs = Array.prototype.slice.call(arguments, 1);
    objs.forEach(function (o) {
        Object.keys(o).forEach(function (k) {
            target[k] = o[k];
        });
    });
    return target;
};


cursed.partition = function (array, partition_size){
    var result = [];
    var current = [];
    while(array.length > 0){
        result.push(array.slice(0, partition_size));
        array = array.slice(partition_size, partition_size.length)
    }

    return result;
}

cursed.debug = function (obj) {
    sys.puts(sys.inspect(obj));
}
