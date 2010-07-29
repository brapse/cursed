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

    this.handler = function(req, body, callback) {
        var url = parse(req.url);
        var args = {};

        var status;
        var response_body = '';
        var headers = {'Content-Type': 'application/json'};

        try {
            args = JSON.parse(body);
        } catch (e) {
            args = body;
        }
        
        var reply = {
            emit: function (content) {
                if(typeof content != "string") { response_body = JSON.stringify(content) }
                response_body = content;
                status = 200;
            },
            error: function (error_msg) {
                status = 500;
                response_body = err_msg;
            }
        }

        // Route lookup
        var route = that.route(url.pathname.replace(/\//,''));

        if(route){
            route(args, req.headers, reply);
        } else {
            response_body = "Couldn't route: " + url.pathname;
            status = 404;
        }
        headers['Content-Length'] = response_body.length;

        callback(status, headers, response_body);
    };

    this.server = http.createServer(function (req, res) {
        var url = parse(req.url);
        sys.puts('requesting ' + url.pathname);
        req.setEncoding('utf8');

        var req_body = '';
        req.addListener('data', function (chunk) { req_body += (chunk || ''); });
        req.addListener('end', function () {
            sys.puts('end of request');
            this.handle(req, res, body, function (status, header, body) {
                res.writeHead(status, header);
                res.end(body);
            });
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
