var sys = require('sys'),
   path = require ('path'),
   http = require('http'),
     fs = require('fs');

var port = process.argv[2] || 8100;

var puts = function(txt){
    sys.puts('server: '+ port + ' -> ' + txt);
}

require.paths.unshift(path.join(__dirname, 'lib'));
var cursed = require('cursed')

// Request Processing
var compute = function(args){
    var is_a_word = function(word) {
        var found = words.filter(function(w) { return w.trim() == word.trim() });
        return found.length > 0
    }
    var reduce = function(word){            
        puts("reducing: " + word);
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

    // Return the reductions of all the words
    return args['words'].map(function(word) { return reduce(word)} );
};

// ######################################

// Start several servers, and send them each work


var server = new(cursed.Server)('127.0.0.1', port);
server.map('/process', compute);

// Get everything started
var words;
fs.readFile('words.txt', 'utf8', function(err, text) {
    if(err) throw err;
    words = text.split('\n');
    server.start();
});
