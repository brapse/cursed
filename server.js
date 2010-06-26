var sys = require('sys'),
   http = require('http');

/* Create a server that accepts an argument and performs a job based on those arguments
 */

http.createServer(function (req, res) {
    // Consume json arguments 
    // Extract from req
    var req_body = '';
    req.addListener('data', function (chunk) {
        sys.puts("Server Receiving: " + chunk);
        req_body += (chunk || '');
    });

    req.addListener('end', function () {
        var res;
        try {
            sys.puts("Received");
            sys.puts(req_body);
            //res = JSON.parse(body);
        } catch (e) {
            sys.puts("json parsing error");
        }
    });
    var data = JSON.stringify({'result': 'success'});

    // Should receive a word and return the length
    res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': data.length});
    res.end(data);
}).listen(8124, "127.0.0.1");

sys.puts('Server running at http://127.0.0.1:8124/');
