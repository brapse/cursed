var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');

var u = require('./utils');

exports.Connection = function (host, port) {
    this.host = host;
    this.port = port;
    this.socket = http.createClient(this.port, this.host);

    this.send = function (command, args, callback) {
        u.p('connnection sending new request');

        var that = this;
        var request = this.socket.request('POST', '/' + command, {'host': this.host });
        request.addListener('error', function(err) {
            // XXX: Retry, or what?
            u.p('error');
            u.pp(arguments);
        });

        request.socket.addListener('error', function(socketException){
            u.p('connection refused');
            callback(new(Error)('Connection Error: connection refused to '
                                    + request.socket.host +':'
                                    + request.socket.port));
        });

        request.addListener('response', function (response) {
            u.p('connection got response');
            response.setEncoding('utf8');
            var body = '';
            response.addListener('data', function (chunk) { body += (chunk || ''); });

            response.addListener('end', function () {
                u.p('client end');
                that.handle(response, body, callback);
            });
        });
        request.end(JSON.stringify(args));
    };

    this.handle = function (response, body, callback) {
        u.p('client handling a request');
        u.pp(body);
        if(response.statusCode == 200){
            if(body.length > 0) {
                try {
                    body = JSON.parse(body);
                } catch (e) {}
            }
 
            callback(null, body);
        } else {
            var failure = new(Error)("Connection got:" + response.statusCode + ":" + body);
            callback(failure);
        }
    };
};
