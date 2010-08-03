var parse = require('url').parse,
     http = require('http'),
      sys = require('sys'),
   child_process = require('child_process');

var cursed = exports;

cursed.Server      = require('./cursed/server').Server;
cursed.Connection  = require('./cursed/connection').Connection;
cursed.MockServer  = require('./cursed/mock_request').mock;
cursed.Router      = require('./cursed/router').Router;

// ################################################


// ################################################

cursed.Worker = function (host, port, task_module) {
    cursed.Server.apply(this, [host, port]);

    try {
        this.server.commands = require(task_module);
    }catch (e) {
        throw new(Error)("Couldn't load task module: " +
                            task_module + " \n" + e);
    }
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
