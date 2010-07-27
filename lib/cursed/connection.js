var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');

exports.Connection = function (host, port) {
    this.host = host;
    this.port = port;
    this.socket = http.createClient(this.port, this.host);

    this.send = function (command, args, callback) {
        var request = this.server.request('POST', '/' + command, {'host': this.host });

        request.addListener('response', function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.addListener('data', function (chunk) {
                body += (chunk || '');
            });

            response.addListener('end', function () {
                if(response.statusCode == 200){
                    try {
                        sys.puts('rawr:' +  body.length);
                        callback(null, JSON.parse(body));
                    } catch (e) {
                        callback(e);
                    }
                }else{
                    var failure = new(Error)("response from server was " + response.statusCode);
                    callback(failure);
                }
            });
        });

        request.end(JSON.stringify(args));
    }
}
