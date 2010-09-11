var spawn = require('child_process').spawn,
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter,
    net = require('net'),
    netBinding = process.binding('net');
    

var u = require('./utils');

this.WorkerProxy = function(node) {
    
    this.node = node;
    this.host = node.host;
    this.command_names = node.command_names;
    this.fd = node.fd;
    this.alive = true;
    
    this.start = function () {
        var executable = process.argv[0],
            cursed_cmd = process.argv[1];
            
        var cmd_args = [cursed_cmd, 'worker', '-t ', 'tasks'];

        var fds = netBinding.socketpair();
        var child = spawn(executable, cmd_args, undefined, [fds[1], 1, 2]);

        if(!child.stdin) {
            child.stdin = new(net.Stream)(fds[0], 'unix');
        } 
        child.stdin.write("have an fd", 'ascii', this.fd);

        // TODO: setup IPC for management etc

        var that = this;
        child.on('exit', function(code) {
            that.alive = false;
            that.node.emitter.emit('child_process_exit', child.pid, code);
        });

        child.stdout = new(net.Stream)(1, 'unix');
        child.stdout.on('data', function (data) {
          if (/^execvp\(\)/.test(data.asciiSlice(0,data.length))) {
            child.emit('exit', 1);
          } else {
            that.emit('child_process_stdout', child.pid, data);
          }
        });

        //child.stderr.addListener('data', function (data) {
            //that.emit('child_process_stderr', child.pid, data);
        //});
    }

    this.kill = function () {
        this.child.kill(arguments);
    }

    this.stop = function () {
        this.child.kill();
    }

    this.restart = function () {
        this.stop();
        this.start();
    }
}

this.Node = function (concurrency, task_module, host, port) {
    // should start child processes that actually do the processesing
    // should have management facilities
    //    - accept and buffer jobs
    //    - persist jobs and results, be resumable on failure
    //    - should restart workers if they die or error
    try {
        this.task_module = require(task_module);
    } catch (e) {
        throw new(Error)('Couldn\'t initialize Node: ' + e);
    }

    this.command_names = Object.keys(this.task_module);

    this.concurrency = concurrency;
    this.host = host;
    this.port = port;

    this.emitter = new(EventEmitter)();
    this.workers = [];
}

this.Node.prototype = {
    on:    function() { this.emitter.on.apply(this, arguments) },
    emit:  function() { this.emitter.emit.apply(this, arguments) },

    start: function (router, callback) {

        var fd = netBinding.socket('tcp4');
        netBinding.bind(fd, this.port, this.host);
        netBinding.listen(fd, 128);
        this.fd = fd;

        // spawn some workers
        for(var i =0; i < this.concurrency; i++) {
            var worker = new(exports.WorkerProxy)(this);
            worker.start();
            this.workers.push(worker);
        }

        var that = this;
        // Forward signals to child processes, keeps the zombies at bay.
        ['SIGINT', 'SIGHUP', 'SIGTERM'].forEach(function(signal){
            process.addListener(signal, function () {
                that.workers.forEach(function (worker) {
                    try {
                        that.workers[i].kill(signal);
                    } catch (err) {
                        // Ignore
                    }
                });
                process.exit();
            });
        });

        // TODO: setup IPC from child processes

        var that = this;
        process.nextTick(function() {
            var living_workers = that.workers.filter(function(w) { return w.alive });
            console.log('living workers: ' + living_workers.length);
            if(living_workers.length === that.concurrency) {
                router.send('register', { host: that.host,
                                          port: that.port,
                                          commands: that.command_names },
                                         callback);
            } else {
                callback(new(Error)("Unable to start workers"));
            }
        });
    }
}
