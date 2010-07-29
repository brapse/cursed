var url = require('url'),
    sys = require('sys'),
    events = require('events');


exports.mock = function(real_server){
    this.server = real_server;
}

exports.mock.prototype = {
    mockRequest: function (path, headers) {
        var uri = url.parse(path || '/');

        headers = headers || {};

        var defaultHeaders = { "accept"      :"application/json",
                               "content-type":'application/json; charset=UTF-8' };

        for (var k in defaultHeaders) { headers[k] = headers[k] || defaultHeaders[k] }

        return {
            listeners: [],
            headers: headers,
            url: uri,
            setBodyEncoding: function (e) { this.bodyEncoding = e },
            writeHead: function(status, headers) {
                this.status = status;
                this.headers = headeres;
            },
            end: function(body) {
                this.body = body;
            }
        }
    },

    request: function (path, headers, body, callback) {
        var request = this.mockRequest(path, headers);
        var body = typeof(body) === 'object' ? JSON.stringify(body) : body;

        this.server.handler(request, body, callback);
    }
}
