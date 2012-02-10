
var express = require('express');
var socketio = require('socket.io');

module.exports.serve = function (stackio, app) {
    var port;
    if (typeof app !== 'object') {
        port = app;
        app = express.createServer();
    }
    socketio = socketio.listen(app);
    app.get('/stack.io/stack.io.js', function (req, res) {
        res.sendfile(__dirname + '/browser_client.js');
    });
    if (port !== undefined)
        app.listen(port);
    bindMessages(stackio, socketio);
};

function bindMessages(stackio, socketio) {
    var rpcChannel = 'rpc_response_channel';

    socketio.sockets.on('connection', function (socket) {
        socket.on('stackio_event_emit', function (message) {
            stackio.emit(message.channel, message.data);
        });
        socket.on('stackio_event_on', function (message) {
            stackio.on(message.channel, function (data) {
                socket.emit(message.channel, data);
            });
        });
        socket.on('stackio_rpc_call', function (message) {
            var args = message.args;
            args.push(function (response, keepOpen) {
                var m = {
                    close: !keepOpen,
                    data: response,
                    id: message.id
                };
                socket.emit(rpcChannel, m);
            });
            stackio.call(message.service, message.method).apply(this, args);
        });
        socket.on('stackio_rpc_expose', function (message) {
            var obj = {};
            for (i in message.args) {
                var method = message.args[i];
                obj[method] = function () {
                    var responseCallback = arguments[arguments.length - 1];
                    if ((typeof responseCallback) == 'function')
                        delete arguments[arguments.length - 1];
                    else
                        responseCallback = null;
                    var args = [];
                    // converting arguments object to an array
                    for (var i in arguments)
                        args.push(arguments[i]);
                    var mId = g_nextId();
                    //var responseChannel = 'stackio_rpc_expose_response_' + Math.floor(Math.random() * 1000001);
                    if (responseCallback) {
                        var replied = false;
                        function cb(m) {
                            if (m.id == mId) {
                                replied = true;
                                if (m.data !== undefined)
                                    responseCallback(m.data, m.close);
                                if (m.close === true)
                                    socket.removeListener(rpcChannel, cb);
                            }
                        }
                        socket.on(rpcChannel, cb);
                        setTimeout(function () {
                            if (replied === true)
                                return;
                            socket.removeListener(rpcChannel, cb);
                        }, 30 * 1000);
                    }
                    var m = {
                        id : mId,
                        method: method,
                        args: args
                    };
                    socket.emit('stackio_rpc_expose_' + message.service, m);
                };
            }
            stackio.expose(message.service, obj);
        });
    });
}
