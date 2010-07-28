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
            "should return correct status code": function (status) {
                assert.equal(status, 200);
            },
            "should set the correct headers": function (_, headers) {
                assert.typeOf(headers, "object");
                assert.equal(headers['Content-Type'], 'application/json');
            },
            "should return A OK": function (_, _, body) {
                assert.typeOf(body, "string");
                assert.equal(body, 'OK');
            }
        }
    }
}).export(module, { error: false });
