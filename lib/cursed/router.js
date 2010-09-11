var Connection = require('./connection').Connection,
        Server = require('./server').Server;

var sys = require('sys');

var u = require('./utils');

exports.Router = function (host, port) {
    Server.apply(this, arguments);

    this.routes = {};

    var that = this;

    this.commands.register = function (args, reply) {
        if(typeof(args) != 'object') {
            reply.error('Invalid Arguments: Give me a route object');
            return
        }
        that.register_route(args);

        reply.success('OK');
    }

    // tell a server where to go
    this.commands.route = function (args, reply) {
        var route = that.find_route(args);
        if (route) {
            reply.success(route);
        } else {
            reply.error('Route not found', 404);
        }
    }

    this.commands.table = function (args, req, reply) {
        reply.success(that.routing);
    }

    this.commands.run = function (args, reply) {
        var cb = function(err, results) {
            if(err) {
                reply.error(err);
            }else{
                u.p('command run emissions!');
                u.pp(results);

                reply.success(results);
            }
        }

        that.run(args['command'], args['args'], cb);
    }

    this.commands.status = function (args, reply) {
        var msg = ['Router online: ' + that.host + ':' + that.port,
                   'cluster: ',
                    sys.inspect(that.routes)];

        reply.success(msg.join("\n"));
    }
}

exports.Router.prototype = {
    find_route: function (command) {
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
        u.p('registering route');
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
            var conn = new(Connection)(route.host, route.port);

            u.p('Routing and starting new connection');
            conn.send(command, args, callback);
        }
    }
};
exports.Router.prototype.__proto__ = Server.prototype;

exports.Router.connection = function (host, port) {
    Connection.apply(this, [host, port]);

    this.run = function (task, args, callback) {
        this.send('route', task, function(err, route) {
            if(err) throw err;
            var con = new(Connection)(route.host, route.port);
            con.send(task, args, callback);
        });
    }

    this.status = function (cb) {
        this.send('status', [], cb);
    }
}

exports.Router.connection.prototype.__proto__ = Connection.prototype;
