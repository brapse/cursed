var cursed = require('../lib/cursed');
var server = new(cursed.Server)('127.0.0.1', 8001);

server.commands = {
    status: function(req, headers, reply) { reply.emit('Hello! :D'); }
}

server.start()
