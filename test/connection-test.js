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
                var mock_response = {statusCode: 200};
                connection.handle(mock_response, '{"foo":"bar"}', this.callback );
            },

            "should be ok": function (err, args) {
                assert.isNull(err);
                assert.isObject(args);
            }
        }
    }
}).export(module, {error: false});
