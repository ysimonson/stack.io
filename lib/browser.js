
var express = require('express');
var socketio = require('socket.io');
var fs = require('fs');

function constructUrl(req) {
    var host = req.headers.host,
        encrypted = req.connection.encrypted,
        hasPort = host.indexOf(':') >= 0,
        port = (hasPort) ? '' : encrypted ? ':443' : ':80';

    return 'http' + (encrypted ? 's://' : '://') + host + port;
}

function cascade(arr, args, end) {
    var l = arr.length, i = 0;
    args.push(function() {});
    function cb(i) {
        if (i < l) {
            args.pop();
            args.push(function() { cb(i + 1); });
            arr[i].apply(undefined, args);
        } else {
            end && end();
        }
    }
    cb(0);
}

var middlewareChain = [];

module.exports.addMiddleware = function(mid) {
    if (typeof mid == 'function') {
        mid = { fn: mid, filter: { service: /^.+$/, method: /^.+$/ } };
    }

    if (!mid.fn || (typeof mid.fn !== 'function')) {
        throw 'Middleware must be a function. Type detected: ' + typeof mid.fn;
    }

    if (!mid.filter) {
        mid.filter = { service: /^.+$/, method: /^.+$/ };
    }

    if (!mid.filter.service || !mid.filter.method) {
        throw 'A filter must contain a service and a method attribute to be valid.\n' +
            JSON.stringify(mid.filter);
    }

    middlewareChain.push(mid);
}

module.exports.serve = function (stackio, app) {
    var port, cache = {};
    if (typeof app !== 'object') {
        port = app;
        app = express.createServer();
    }
    socketio = socketio.listen(app);
    app.get('/stack.io/stack.io.js', function (req, res) {
        if (!cache.template) {
            return fs.readFile(__dirname + '/browser_client_tmpl.js', 'utf-8', function(err, data) {
                if (err)
                    return res.send(err, 500);
                cache.template = data;
                cache[req.headers.host] = data.replace(/\/\*\*HOST\*\*\//g, constructUrl(req));
                res.send(cache[req.headers.host], { 'content-type': 'text/javascript'});
            });
        }

        if (!cache[req.headers.host]) {
            cache[req.headers.host] = cache.template.replace(/\/\*\*HOST\*\*\//g, constructUrl(req));
        }

        res.send(cache[req.headers.host], { 'content-type': 'text/javascript'});
    });
    if (port !== undefined)
        app.listen(port);
    bindMessages(stackio, socketio);
};

function bindMessages(stackio, socketio) {
    var rpcChannel = 'rpc_response_channel';

    socketio.sockets.on('connection', function (socket) {
        socket.on('stackio_rpc_call', function (message) {
            var responseCb = function (response, keepOpen) {
                var m = {
                    close: !keepOpen,
                    data: response,
                    id: message.id
                };
                socket.emit(rpcChannel, m);
            };

            var applicableMiddlewares = middlewareChain.reduce(function(prev, item) {
                var f = item.filter;
                // The test below is a XOR
                if (!f.reversed != !(f.service.test(message.service) && f.method.test(message.method))) {
                    prev.push(item.fn);
                }
                return prev;
            }, []);

            cascade(applicableMiddlewares, [message, responseCb], function() {
                console.log('All middleware passed.');
                var args = message.args;
                args.push(responseCb);
                console.log(message);
                stackio.call(message.service, message.method, { session: message.session }).apply(stackio, args);
            });
        });
    });
}
