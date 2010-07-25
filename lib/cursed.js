var parse = require('url').parse,
     http = require('http'),
      sys = require('sys'),
   child_process = require('child_process');

var debug = true;

var cursed = this;

var log = function (msg) {
    if(debug) sys.puts(msg);
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

// ################################################

cursed.Router = function (host, port) {
    this.host = host;
    this.port = port;
    this.server = new(cursed.Server)(host, port);
    this.routes = [];

    var that = this;

    this.server.commands = {
        status:   function(args, headers, reply) {
            reply.emit('A OK');
        },
        register: function(args, headers, reply) {
            if(Array.isArray(args)){
                that.routes.append(args);
                reply.emit('OK');
            } else {
                reply.error('register expects an array of tuples');
            }
            
        },
        table: function (args, req, reply) {
            reply.emit(that.routing);
        }
    }
}

cursed.Router.prototype = {
    start: function () {
       this.server.start();
    },
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

    queue: function (job, args) {
        this._queue.push([job, args]);
    }

}

cursed.Router.connection = function (host, port) {
    this.host = host;
    this.port = port;
    this.connection = new(cursed.Server.connection)(this.port, this.host);
    this.routing_table = [];

    this.register = function (cluster) {
        cluster.workers.forEach(function (server) {
            var args = { host: server.host, port: server.port, commands: server.commands };
            this.connection.send('register', args, function(err, response){
                if(err) throw err;
                // should just work, lol
            });
        });
    }
    this.sync = function () {} // sync the routing table from

    this.emit = function() { /* msg, result */
        // Communicate witht the cluster
        var args = Array.slice.apply(arguments);
        var msg, result;
        // Lack of msg defaults to 'return', which sends
        // the result back to the router as the result of the job
        if (args.length == 1) {
            msg    = 'return';
            result = args[0];
        } else {
            msg    = args[0];
            result = args[0];
        }
    }
}

// ################################################

cursed.Worker = function(host, port, task_module) {
    this.host = host;
    this.port = port;

    // Fetch the commands
    this.server = new(cursed.Server)(host, port);

    //this.server.commands = require(task_module);

    // Delegate
    this.start   = function () { this.server.start() };
    this.stop    = function () { this.server.stop() };
    this.restart = function () { this.server.restart() };
}

//A Collection of workers
cursed.Cluster = function (concurrency, task_module, ip, port) {
    if(!port) port = 8001;
    
    var that = this;
    var create_worker = function (ip, port) {
        var child = child_process.spawn('node', ['worker.js', ip, port, task_module]);
        child.stdout.addListener('data', function (data) {
            log(data);
        });

        child.stderr.addListener('data', function (data) {
            log('ERROR: ' + data);
        });
    }

    // start a bunch of child processes
    this.workers = []
    for(var i =0; i < concurrency; i++) this.workers.push(create_worker(ip, port + i));
}

cursed.Server = function (host, port) {
    this.host = host;
    this.port = port;
    this.commands = {};

    this.commands.status = function (args, headers, reply) {
        reply.emit('OK');
    }

    var that = this;

    this.server = http.createServer(function (req, res) {
        req.setEncoding('utf8');

        var req_body = '';
        req.addListener('data', function (chunk) {
            log("Server Receiving...");
            req_body += (chunk || '');
        });

        req.addListener('end', function () {
            log('end of request');
            var url = parse(req.url);
            var args = {};
            try {
                args = JSON.parse(req_body);
            } catch (e) {
                // some things don't require arguments
            }
            
            var reply = {
                emit: function (content) {
                    if(typeof content != "string") { content = JSON.stringify(content) }
                    res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': content.length});
                    res.end(content);
                },
                error: function (error_msg) {
                    res.writeHead(500, {'Content-Type': 'application/json', 'Content-Length': err_msg.length});
                    res.end(response_body);
                }
            }

            // Route lookup
            log('requesting ' + url.pathname);
            var route = that.route(url.pathname.replace(/\//,''));

            if(route){
                // If the function doesn't emit, the server will just not respond
                // FIXME: this will blow up in my face
                route(args, req.headers, reply);
            } else {
                var response_body = "Couldn't route: " + url.pathname;
                res.writeHead(404, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
                res.end(response_body);
            }
        });
    });
}

// ##############################################

cursed.Server.prototype = {
    start: function () {
        log('Server listening: ' + this.host + ':' + this.port);
        this.server.listen(this.port, this.host);
    },
    stop: function () {
        this.server.close();
    },
    restart: function () {
        this.stop();
        this.start();
    },
    route: function (command) {
        sys.puts('routing: ' + command);
        if(command in this.commands) return this.commands[command]
    }
}

cursed.Server.connection = function (host, port) {
    this.host = host;
    this.port = port;
    this.socket = http.createClient(this.port, this.host);

    this.send = function (command, args, callback) {
        var request = this.server.request('POST', '/' + command, {'host': this.host});

        request.addListener('response', function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.addListener('data', function (chunk) {
                body += (chunk || '');
            });

            response.addListener('end', function () {
                if(response.statusCode == 200){
                    try {
                        callback(null, JSON.parse(body));
                    } catch (e) {
                        callback(e);
                    }
                }else{
                    var failure = new(Error)("response from server was " + response.statusCode);
                    callback(failure);
                }
            });
        });

        log('sending request: ' + command);
        request.end(JSON.stringify(args));
    }
}

// ##############################################

cursed.partition = function(array, partition_size){
    var result = [];
    var current = [];
    while(array.length > 0){
        result.push(array.slice(0, partition_size));
        array = array.slice(partition_size, partition_size.length)
    }

    return result;
}
