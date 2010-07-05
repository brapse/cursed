// Create  a process that sends jobs to a server and returns the result
var sys = require('sys'),
   http = require('http'),
    fs  = require('fs'),
    path = require('path');

require.paths.unshift(path.join(__dirname, 'lib'));
var cursed = require('cursed')

var worker = new(cursed.Worker)('127.0.0.1', 8102);

fs.readFile('dictionary.txt', 'utf8', function (err, data) {
    if (err) throw err;
    data = data.split('\n').map(function(l){return l.trim()});
    
    var partitions = cursed.partition(data, 100);

    partitions.forEach(function(words){
        //Dispatch to a worker
        worker.run('process', {words: words}, function(err, results){
            if(err){
                sys.puts('failed: ' + err);
            } else {
                sys.puts('success!');
                sys.puts(sys.inspect(results));
            }
        });
    });
});

