var parse = require('url').parse,
     http = require('http'),
      sys = require('sys');


this.Worker = function(host, port){
    this.host   = host;
    this.port   = port;
    this.server = http.createClient(this.port, this.host);
};

this.Worker.prototype = {
    run: function(command, args, callback){
        var request = this.server.request('POST', '/process', {'host': this.host});

        request.addListener('response', function (response) {
            response.setEncoding('utf8');
            var body = '';
            response.addListener('data', function (chunk) {
                body += (chunk || '');
            });

            response.addListener('end', function () {
                if(response.statusCode == 200){
                    try {
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

        sys.puts('sending request: ' + command);
        request.end(JSON.stringify(args));
    }
}

this.Server = function(host, port){
    this.host = host;
    this.port = port;
    this.process = function(){};
    this.routes = [];

    var that = this;

    this.map('/status', function(args){
        // should return 'AOK'
    });
    
    this.server = http.createServer(function (req, res) {
        req.setEncoding('utf8');

        var req_body = '';
        req.addListener('data', function (chunk) {
            sys.puts("Server Receiving...");
            req_body += (chunk || '');
        });

        req.addListener('end', function () {
            sys.puts('end of request');
            var url = parse(req.url);
            var args = {};
            try {
                args = JSON.parse(req_body);
            } catch(e) {
                sys.puts('error parsing request');
                sys.puts(req_body);
            }
            
            sys.puts('requesting ' + url.pathname);
            var route = that.route(url.pathname);

            if(typeof route == 'function'){
                var result = route(args);
                var response_body = JSON.stringify({ 'result': result });
                res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
            } else {
                var response_body = JSON.stringify({ 'result': []});
                res.writeHead(404, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
            }
                
            res.end(response_body);
        });
    });
}

this.Server.prototype = {
    start: function(){
        sys.puts('Server listening: ' + this.host + ':' + this.port);
        this.server.listen(this.port, this.host);
    },
    stop: function(){
        this.server.close();
    },
    restart: function(){
        this.stop();
        this.start();
    },
    route: function(path){
        var matches = this.routes.filter(function(r){
            return r[0] == path;
        });

        if(matches.length > 0) return matches[0][1];
    },
    map: function(path, callback){
        this.routes.push([path, callback]);
    }
}

// ##############################################

this.partition = function(array, partition_size){
    var result = [];
    var current = [];
    while(array.length > 0){
        if(current.length < partition_size){
            current.push(array.shift());
        }else{
            result.push(current);
            current = [];
        }
    }

    return result;
}
