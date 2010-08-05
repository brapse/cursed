var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');

var u = require('./utils');

exports.Server = function (host, port) {
    this.host = host;
    this.port = port;
    this.commands = {};

    this.commands.status = function (args, headers, reply) {
        reply.emit('OK');
    }

    var that = this;

    this.handler = function(req, body, callback) {
        var url = parse(req.url);
        var headers = {'Content-Type': 'application/json'};

        var args = body;

        // Try parsing the arguments as json
        if(typeof(args) == 'string' && args.length > 0) {
            try {
                args = JSON.parse(body);
            } catch (e) {}
        }

        // Construct the reply object
        var reply = {
            emit: function (content) {
                if(typeof content === "object") { 
                    content = JSON.stringify(content);
                }

                headers['Content-Length'] = content.length;
                callback(200, headers, content);
            },
            error: function (error_msg, status_code) {
                u.p('reply.emit:' + error_msg);

                if(typeof error_msg === 'object') {
                    error_msg = JSON.stringify(error_msg);
                }

                headers['content-length'] = error_msg.length;
                callback(status_code || 500, headers, error_msg);
            }
        }

        // Route lookup
        var route = that.route(url.pathname.replace(/\//,''));

        if(typeof(route) === 'function'){
            try {
                route(args, req.headers, reply);
            } catch (e) {
                reply.error('COMMAND ERROR: ' + e);
            }
        } else {
            reply.error("Couldn't route: " + url.pathname, 404)
        }
    };

    this.server = http.createServer(function (req, res) {
        var url = parse(req.url);
        u.p('requesting ' + url.pathname);
        req.setEncoding('utf8');

        var req_body = '';
        req.addListener('data', function (chunk) { req_body += (chunk || ''); });
        req.addListener('end', function () {
            that.handler(req, req_body, function (status, header, body) {
                u.p('server responding with:');
                res.writeHead(status, header);
                res.end(body);
            });
        });
    });
}

exports.Server.prototype = {
    start: function () {
        this.server.listen(this.port, this.host);
    },
    stop: function () {
        this.server.close();
    },
    restart: function () {
        this.server.stop();
        this.server.start();
    },
    route: function (command) {
        // FIXME: don't use in
        if(command in this.commands) return this.commands[command]
    }
}
