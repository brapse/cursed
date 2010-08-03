var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');

exports.Connection = function (host, port) {
    this.host = host;
    this.port = port;
    this.socket = http.createClient(this.port, this.host);

    this.send = function (command, args, callback) {
        callback = callback || function(err, res) {};

        var that = this;
        var request = this.socket.request('POST', '/' + command, {'host': this.host });
        request.addListener('error', function(err) {
            // XXX: Retry, or what?
            sys.puts('error:');
            sys.debug(arguments);
        });

        request.socket.addListener('error', function(socketException){
            callback(new(Error)('Connection Error: connection refused to '
                                    + request.socket.host +':'
                                    + request.socket.port));
        });

        request.addListener('response', function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.addListener('data', function (chunk) { body += (chunk || ''); });

            response.addListener('end', function () {
                that.handle(response, body, callback);
            });
        });

        request.end(JSON.stringify(args));
    };

    this.handle = function (response, body, callback) {
        if(response.statusCode == 200){
            var args;
            try {
                args = JSON.parse(body);
            } catch (e) {
                args = body;
            }
            callback(null, args);
        } else {
            var failure = new(Error)("response from server was " + response.statusCode);
            callback(failure);
        }
    };
};
