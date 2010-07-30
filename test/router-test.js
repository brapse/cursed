var sys = require('sys');
    vows = require('vows'),
    assert = require('assert'),
    cursed = require('../lib/cursed');

vows.describe('cursed.Router').addBatch({
        'A router': {
            topic: function () {
                return new(cursed.Router)('127.0.0.1', 8000);
            },
            'should construct a Router instance': function (router) {
                assert.instanceOf(router, cursed.Router);
            },
            'Status request': {
                topic: function (router) {
                    var mock_router = new(cursed.MockServer)(router);
                    mock_router.request('status', {}, {}, this.callback);
                },
                "should respond with OK": function (status, headers, body) {
                    assert.equal(status, 200);

                    assert.typeOf(headers, "object");
                    assert.equal(headers['Content-Type'], 'application/json');

                    assert.typeOf(body, "string");
                    assert.equal(body, 'OK');
                }
            },
            'Register': {
                topic: function (router) {
                   this.router = router;
                    var mock_router = new(cursed.MockServer)(router);
                    var node = { host: '127.0.0.1', 
                                 port: 8001, 
                                 commands: ['map', 'reduce', 'finalize'] }
                    mock_router.request('register', {}, node, this.callback);
                },
               "should succeed":  function (status) {
                   assert.equal(status, 200);
               },
               "should register the node in the routing table": function () {
                   assert.typeOf(this.router.routes, 'object');

                   assert.isTrue('map'      in this.router.routes);
                   assert.isTrue('reduce'   in this.router.routes);
                   assert.isTrue('finalize' in this.router.routes);
               }
            },
            'Route': {
                topic: function() {
                    var router = new(cursed.Router)('127.0.0.1', 8000);
                    router.routes = { test: 
                                        [{host: '127.0.0.1', port: 8001, weight: 1}]
                                    }

                    var mock_router = new(cursed.MockServer)(router);
                    mock_router.request('route', {}, 'test', this.callback);
                },
               'Should provide the correct routing table': function(status, headers, route) {
                   assert.equal(status, 200);

                   assert.typeOf(route, 'object');
                   assert.equal(route.host, '127.0.0.1');
                   assert.equal(route.port, 8001);
               },
            }
        }
}).export(module, { error: false });
