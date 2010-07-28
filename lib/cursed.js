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
    this.routes = [];

    var that = this;

    this.commands.register = function(args, headers, reply) {
        if(Array.isArray(args)){
            that.routes.append(args);
            reply.emit('OK');
        } else {
            reply.error('register expects an array of tuples');
        }
    }
    this.commands.table = function (args, req, reply) {
        reply.emit(that.routing);
    }
}

cursed.Router.prototype = Object.create(cursed.Server.prototype, {
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
});

// ################################################

cursed.Worker = function(host, port, task_module) {
    cursed.Server.apply(this, [host, port]);

    this.server.commands = require(task_module);
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

cursed.partition = function(array, partition_size){
    var result = [];
    var current = [];
    while(array.length > 0){
        result.push(array.slice(0, partition_size));
        array = array.slice(partition_size, partition_size.length)
    }

    return result;
}
