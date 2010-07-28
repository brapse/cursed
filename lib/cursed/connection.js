var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');

exports.Connection = function (host, port) {
    this.host = host;
    this.port = port;
    this.socket = http.createClient(this.port, this.host);

    this.send = function (command, args, callback) {
        var request = this.socket.request('POST', '/' + command, {'host': this.host });

        request.addListener('response', function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.addListener('data', function (chunk) {
                body += (chunk || '');
            });

            response.addListener('end', function () {
                if(response.statusCode == 200){
                    var args;
                    try {
                        args = JSON.parse(body);
                    } catch (e) {
                        args = body;
                    }
                    callback(null, args);
                }else{
                    var failure = new(Error)("response from server was " + response.statusCode);
                    callback(failure);
                }
            });
        });

        request.end(JSON.stringify(args));
    }
}
