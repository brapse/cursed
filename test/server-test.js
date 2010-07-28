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
                helpers.make_request('127.0.0.1', 8001, '/status', {}, this.callback );
            },
            "should be ok": function(res) {
                assert.typeOf(res, "string");
            }
        }
    }
}).export(module);
