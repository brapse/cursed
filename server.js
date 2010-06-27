var sys = require('sys'),
   http = require('http');

/* Create a server that accepts an argument and performs a job based on those arguments
 */

// Setup Proccess


// Request Processing
var process = function(args){
    // expects a hash with a sing key, data as one long string
    var lines = args['data'].split('\n');
    lines.forEach(function(el){
        sys.puts(el);
    });
    sys.puts('processed: ' + lines.length);
};

// Setup Server

http.createServer(function (req, res) {
    // Consume json arguments 
    // Extract from req
    req.setEncoding('utf8');

    var req_body = '';
    req.addListener('data', function (chunk) {
        sys.puts("Server Receiving...");
        req_body += (chunk || '');
    });

    req.addListener('end', function () {
        try {
            sys.puts("Received");
            var data = JSON.parse(req_body);
            sys.puts(data);
            process(data);
        } catch (e) {
            sys.puts("json parsing error");
            throw e;
        }

        // Respond
        var response_body = JSON.stringify({'result': 'success'});

        res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
        res.end(response_body);
    });
}).listen(8124, "127.0.0.1");

sys.puts('Server running at http://127.0.0.1:8124/');
