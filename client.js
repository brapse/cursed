// Create  a process that sends jobs to a server and returns the result
var sys = require('sys'),
   http = require('http');

var server = http.createClient(8124, 'localhost');

var request = server.request('POST', '/', {'host': 'localhost'});

request.write(JSON.stringify({'foo': "Bar"}));

request.addListener('response', function (response) {
      //sys.puts('STATUS: ' + response.statusCode);
      //sys.puts('HEADERS: ' + JSON.stringify(response.headers));
    
    //consume data, recompile as a peice of json and parse
    response.setEncoding('utf8');
    var body = '';
    response.addListener('data', function (chunk) {
        sys.puts("receiving");
        body += (chunk || '');
    });

    response.addListener('end', function () {
        var res;
        try {
            sys.puts("Client received");
            sys.puts(body);
            res = JSON.parse(body);
        } catch (e) {
            sys.puts("json parsing error");
        }
    });
});

request.end();
