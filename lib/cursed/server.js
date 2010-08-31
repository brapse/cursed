var parse = require('url').parse,
     http = require('http'),
      sys = require('sys'),
    EventEmitter = require('events').EventEmitter;

var u = require('./utils');

var Commitment = function(){};
sys.inherits(Commitment, EventEmitter);

Commitment.prototype.commit = function (timeout) {
    var timeoutId = setTimeout(function(){
        this.emit('timeout');
    }, timeout);

    this.on('called', function () {
        clearTimeout(timeoutId);
    });
}

Commitment.prototype.success = function () {
    this.emit('called');
    var args = Array.prototype.slice.apply(arguments);
    args.unshift('success');
    this.emit.apply(this, args);
};

Commitment.prototype.error = function(){
    this.emit('called');
    var args = Array.prototype.slice.apply(arguments);
    args.unshift('error');
    this.emit.apply(this, args);
};

exports.Server = function (host, port) {
    this.host = host;
    this.port = port;
    this.commands = {};

    this.commands.status = function (args, reply) {
        reply.success('OK');
    }

    var that = this;

    this.timeout = 30000

    var try_parsing = function(body) {
        if(typeof(body) == 'string' && body.length > 0) {
            try {
                body = JSON.parse(body);
            } catch (e) {}
        }
        return body;
    }

    var serialize = function(content) {
        if(typeof content === "object") { 
            content = JSON.stringify(content);
        }
        return content
    }

    // ############################################

    this.handler = function(req, body, callback) {
        var url = parse(req.url);
        var headers = {'Content-Type': 'application/json'};

        var args = try_parsing(body);

        var reply = new(Commitment);
        reply.on('success', function(result) {
            var content = serialize(result);
            headers['Content-Length'] = content.length;
            callback(200, headers, content);
        });

        reply.on('error', function(error_msg, status_code) {
            if(typeof error_msg === 'object') {
                error_msg = JSON.stringify(error_msg);
            }

            headers['content-length'] = error_msg.length;
            callback(status_code || 500, headers, error_msg);
        });

        reply.on('timeout', function() {
            reply.error('command timed out:' + this.timeout, 500);
        });

        this.dispatch(url, args, reply);
    };

    this.dispatch = function(url, args, reply) {
        var command = this.find_command(url);

        if(typeof(command) === 'function'){
            try {
                reply.commit(this.timeout);
                command(args, reply);

            } catch (e) {
                reply.error('COMMAND ERROR: ' + e);
            }
        } else {
            reply.error("Couldn't route: " + url.pathname, 404);
        }
    }

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
    find_command: function (url) {
        var command = url.pathname.replace(/\//,'');

        if(this.commands.hasOwnProperty(command)) return this.commands[command];
    }
}
