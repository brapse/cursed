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
    var binary_search = function(needle, haystack){
        var start = 0,
            end   = haystack.length - 1,
            middle;

        while(start < end){
            middle = Math.floor((end - start) / 2) + start;
            //sys.puts(start + ' ' + end + ' ' + middle);

            if(haystack[middle] == needle)
                return middle;

            if(needle < haystack[middle])
                end = middle -1;
            else
                start = middle +1;
        }

        return -1;
        
    }

    var is_a_word = function(word){
        var found = binary_search(word.trim(), words);
        return found != -1;
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
    words = text.split('\n').map(function(f){ return f.trim() });

    server.start();
});
