var cursed  = require('../lib/cursed'),
    helpers = require('./helper');
       vows = require('vows'),
     assert = require('assert');

vows.describe('cursed.Connection').addBatch({
    'A simple connection': {
        topic: function () {
            return new(cursed.Connection)('127.0.0.1', 8001);
        },
        'should construct an instanece of the server': function(connection) {
            assert.instanceOf(connection, cursed.Connection);
        },

        'Requesting': {
            topic: function (connection) {
                connection.send('status', {}, this.callback);
            },
            "should be ok": function(res) {
                assert.typeOf(res, "string");
            }
        }
    }
}).export(module);
