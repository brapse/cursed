var sys = require('sys');
var vows = require('vows');
var assert = require('assert');
var cursed = require('../lib/cursed');

var helpers = require('./helper');

// Start a server

// You have to start an external server for this to work
vows.describe('cursed.Server').addBatch({
    'A simple server': {
        topic: function () {
            return new(cursed.Server)('127.0.0.1', 8002);
        },
        'should construct an instanece of the server': function(server) {
            assert.instanceOf(server, cursed.Server);
        },

        'Requesting': {
            topic: function (server) {
                var mock_server = new(cursed.MockServer)(server);
                mock_server.request('/status', {}, {}, this.callback);
            },
            "should succeed": function(status, headers, body) {
                assert.equal(status, 200);
            },
            "should return A OK": function(status, headers, body) {
                //sys.puts(sys.inspect(arguments));
                //assert.typeOf(body, "string");
            }
        }
    }
}).export(module);
