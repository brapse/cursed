var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');


exports.Server = function (host, port) {
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
            sys.puts("Server Receiving...");
            req_body += (chunk || '');
        });

        req.addListener('end', function () {
            sys.puts('end of request');
            var url = parse(req.url);
            var args = {};
            try {
                args = JSON.parse(req_body);
            } catch (e) {
                // some things don't require arguments
            }
            
            var response_body = '';
            var reply = {
                emit: function (content) {
                    if(typeof content != "string") { response_body = JSON.stringify(content) }
                    response_body = content;
                    res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
                },
                error: function (error_msg) {
                    res.writeHead(500, {'Content-Type': 'application/json', 'Content-Length': err_msg.length});
                    res.end(response_body);
                }
            }

            // Route lookup
            sys.puts('requesting ' + url.pathname);
            var route = that.route(url.pathname.replace(/\//,''));

            if(route){
                route(args, req.headers, reply);
            } else {
                var response_body = "Couldn't route: " + url.pathname;
                res.writeHead(404, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
            }

            res.end(response_body);
        });
    });
}

exports.Server.prototype = {
    start: function () {
        sys.puts('Server listening: ' + this.host + ':' + this.port);
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
        sys.puts('routing: ' + command);
        if(command in this.commands) return this.commands[command]
    }
}
