var sys = require('sys'),
   http = require('http'),
   fs = require('fs');

// Accept a list of words, returns a set of all the reductions of that word
var words;

var is_a_word = function(word) {
    var found = words.filter(function(w) { return w == word });
    return found.length == 1
}
                                                    
// This is wrong, the reduction must come from each side
var reduce = function(word){            
    sys.puts("reducing: " + word);
    // reductions is sequential substrings within word
    var reductions = [word];
    var front;
    var back;
       
    for(var i=1; i < word.length ; i++){
        front= word.substring(word.length, i);
        if(is_a_word(front)){
            reductions.push(front);
        }
        back = word.substring(0, i);
        if(is_a_word(back)){
            reductions.push(back);
        }
    }

    return reductions.map(function(r){ return r.trim() });
};

// Request Processing
var process = function(args){
    // Return the reductions of all the words
    var words = args['data'].split('\n');
    return words.map(function(word) { return reduce(word)} );
};

// ######################################

//var server = new(cursed.Worker)(

var server = http.createServer(function (req, res) {
    req.setEncoding('utf8');

    var req_body = '';
    req.addListener('data', function (chunk) {
        sys.puts("Server Receiving...");
        req_body += (chunk || '');
    });

    req.addListener('end', function () {
        sys.puts("Received");
        var data = '';
        try {
            data = process(JSON.parse(req_body));
        } catch (e) {
            sys.puts("Processing failed");
            throw e;
        }

        // Respond
        var response_body = JSON.stringify({'result': 'success', 'data': data });

        res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': response_body.length});
        res.end(response_body);
    });
});

// Get everything started
fs.readFile('words.txt', 'utf8', function(err, text) {
    words = text.split('\n');
    server.listen(8124, "127.0.0.1");
    sys.puts('Server running at http://127.0.0.1:8124/');
});


