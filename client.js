// Create  a process that sends jobs to a server and returns the result
var sys = require('sys'),
   http = require('http'),
    fs  = require('fs');


//This client needs to partition requests accross multiple running processes
var server = http.createClient(8124, 'localhost');

var request = server.request('POST', '/process', {'host': 'localhost'});

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

fs.readFile('dictionary.txt', 'utf8', function (err, data) {
  if (err) throw err;
  request.write(JSON.stringify({'data': data}));
  request.end();
});

