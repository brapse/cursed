var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');

var cursed = exports;

cursed.utils       = require('./cursed/utils');
cursed.Server      = require('./cursed/server').Server;
cursed.Connection  = require('./cursed/connection').Connection;
cursed.MockServer  = require('./cursed/mock_request').mock;
cursed.Router      = require('./cursed/router').Router;
cursed.Node        = require('./cursed/node').Node;

// ################################################

cursed.Worker = function (task_module) {
    cursed.Server.apply(this, []);

    var task_commands = {};
    try {
        task_commands = require(task_module);
    }catch (e) {
        throw new(Error)("Couldn't load task module: " +
                            task_module + " \n" + e);
    }
    mixin(this.commands, task_commands);
    this.command_names = Object.keys(task_commands);
}

cursed.Worker.prototype.__proto__ = cursed.Server.prototype;

cursed.Worker.connection = function(host, port) {
}

// ##############################################

var mixin = function (target) {
    var objs = Array.prototype.slice.call(arguments, 1);
    objs.forEach(function (o) {
        Object.keys(o).forEach(function (k) {
            target[k] = o[k];
        });
    });
    return target;
};


cursed.partition = function (array, partition_size) {
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
