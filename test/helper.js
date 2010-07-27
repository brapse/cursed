var http = require('http'),
     sys = require('sys');

// Test helpers
exports.make_request = function (host, port, url, args, callback) {
    var socket = http.createClient(port, host);

    var request = socket.request('POST', url, { 'host': host });

    request.addListener('response', function (response) {
        response.setEncoding('utf8');
        var body = '';
        response.addListener('data', function (chunk) {
            body += (chunk || '');
        });

        response.addListener('end', function () {
            if(response.statusCode == 200){
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
