var Connection = require('./connection').Connection,
        Server = require('./server').Server;

var sys = require('sys');

exports.Router = function (host, port) {
    Server.apply(this, arguments);

    this.routes = {};

    var that = this;

    this.commands.register = function (args, headers, reply) {
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

    this.commands.run = function (args, headers, reply) {
        var cb = function(err, results) {
            if(err) {
                reply.error(err);
            }else{
                reply.emit(results);
            }
        }

        that.run(args['command'], args['args'], cb);
    }
}

exports.Router.prototype = {
    find_route: function (command) {
        console.log('finding routes');
        // XXX: Check that worker is accepting jobs
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
        console.log('registering route');
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

    run: function(command, args, callback) {
        // TODO: Rate limit ensure we arn't flooding a worker
        //
        var route = this.find_route(command);
        if(!route){
            callback(new(Error)("No registered route for: " + command));
        }else{
            // XXX: Pool connection, keep em open
            console.log('Routing and starting new connection');
            var conn = new(Connection)(route.host, route.port);

            conn.send(command, args, callback);
        }
    }
};
exports.Router.prototype.__proto__ = Server.prototype;

exports.Router.connection = function (host, port) {
    Connection.apply(this, [host, port]);

    this.run = function (task, args, callback) {
        this.send('run', { command: task, args: args }, callback);
    }
}

exports.Router.connection.prototype.__proto__ = Connection.prototype;
