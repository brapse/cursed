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

        var status = 200;
        var response_body = '';
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
                if(typeof content != "string") { content = JSON.stringify(content) }
                response_body = content;
                status = 200;
            },
            error: function (error_msg, status_code) {
                status = status_code || 500;
                console.log('SERVER ERROR:' + error_msg);
                response_body = error_msg.toString();
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
            response_body = "Couldn't route: " + url.pathname;
            status = 404;
        }

        headers['Content-Length'] = response_body.length;
        callback(status, headers, response_body);
    };

    this.server = http.createServer(function (req, res) {
        var url = parse(req.url);
        console.log('requesting ' + url.pathname);
        req.setEncoding('utf8');

        var req_body = '';
        req.addListener('data', function (chunk) { req_body += (chunk || ''); });
        req.addListener('end', function () {
            that.handler(req, req_body, function (status, header, body) {
                console.log('server responding with:');
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
