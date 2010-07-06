// Create  a process that sends jobs to a server and returns the result
var sys = require('sys'),
   http = require('http'),
    fs  = require('fs'),
    path = require('path');

require.paths.unshift(path.join(__dirname, 'lib'));
var cursed = require('cursed')

var concurrency = process.argv[2] || 1
var workers = [];

// TODO: think about process affinity
var base_port = 8100;
while(workers.length < concurrency){
    workers.push(new(cursed.Worker)('127.0.0.1', base_port++));
}

sys.puts('Starting client with: ' + workers.length + ' workers');

fs.readFile('words.txt', 'utf8', function (err, data) {
    if (err) throw err;
    data = data.split('\n').map(function(l){return l.trim()});
    
    var partitions = cursed.partition(data, 100);

    var current = workers[0];
    partitions.forEach(function(words){
        //Dispatch to a worker
        current.run('process', {words: words}, function(err, results){
            if(err){
                sys.puts('failed: ' + err);
            } else {
                sys.puts('success!');
                sys.puts(sys.inspect(results));
            }
        });
        workers.push(current);
        current = workers.shift();
    });
});

