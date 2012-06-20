/**
 * Distributed Message Queue library implementing the EventEmitter API
 * Copyright 2011 DotCloud Inc (Samuel Alba <sam@dotcloud.com>))
 *
 * This project is free software released under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function() {
    var stackio_obj = (function () {
        var _socket;
        var session = {};
        var rpcChannel = 'rpc_response_channel';
        var that = this;

        function objValues(obj) {
            var result = [];
            for (var k in obj) {
                result.push(obj[k]);
            }
            return result;
        }

        function constructor() {
            _socket = io.connect('/**HOST**/');
            return that;
        };

        this.session = function() {
            return session;
        }

        this.emit = function (channel /*, data... */) {
            throw 'Emitting and receiving events from the browser is restricted for security reasons. Use RPC calls instead';
        };

        this.on = function (channel, callback) {
            throw 'Emitting and receiving events from the browser is restricted for security reasons. Use RPC calls instead';
        };

        this.call = function (service, method) {
            return function () {
                var responseCallback = arguments[arguments.length - 1];
                if ((typeof responseCallback) == 'function')
                    delete arguments[arguments.length - 1];
                else
                    responseCallback = null;
                var args = [];
                // converting arguments object to an array
                for (var i in arguments)
                    args.push(arguments[i]);
                var message = {
                    id : Math.floor(Math.random() * 1000001),
                    args: args,
                    service: service,
                    method: method,
                    session: session
                };
                if (responseCallback) {
                    var replied = false;
                    function cb(m) {
                        if (m.id == message.id) {
                            replied = true;
                            if (m.data !== undefined)
                                responseCallback(m.data);
                            if (m.close === true)
                                _socket.removeListener(rpcChannel, cb);
                        }
                    }
                    _socket.on(rpcChannel, cb);
                    setTimeout(function () {
                        if (replied === true)
                            return;
                        _socket.removeListener(rpcChannel, cb);
                    }, 30 * 1000);
                }
                _socket.emit('stackio_rpc_call', message);
            };
        };

        this.expose = function (service, obj) {
            throw 'Exposing services from the browser has been disabled for security reasons.';
        };

        return constructor;
    });

    if (typeof define == 'function' && define.amd) { // RequireJS or similar AMD lib is present.
        define(['/**HOST**//socket.io/socket.io.js'], function() {
            return new stackio_obj();
        });
    } else {
        document.write('<script src="/**HOST**//socket.io/socket.io.js"></script>');
        window.stackio = function() {
            return (new stackio_obj())();
        };
    }
})();