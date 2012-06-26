var io = require("socket.io"),
    model = require("../model"),
    util = require("util"),
    BaseConnector = require("./base");

function SocketIOConnector(app, config) {
    BaseConnector.call(this, app, config);
}

util.inherits(SocketIOConnector, BaseConnector);

SocketIOConnector.prototype.start = function() {
    var self = this;
    self._sessionIdCounter = 0;
    var sio = io.listen(self.app, {log: false});

    var socketEventProxy = function(callback) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(this);
            callback.apply(self, args);
        };
    };

    sio.sockets.on("connection", function(socket) {
        socket.on("init", socketEventProxy(self._doInit));
        socket.on("invoke", socketEventProxy(self._doInvoke));
        socket.on("disconnect", socketEventProxy(self._doDisconnect));
    });
}

//Initializes a new session
//socket : Object
//      The socket.io socket
//options : Object
//      The ZeroRPC client options
//callback : function(error : object, user_id : number, permissions : array of
//           strings, services : array of strings)
//      The callback to call when the initialization is complete
SocketIOConnector.prototype._doInit = function(socket, options, callback) {
    try {
        if(socket.sessionId) throw "session already initialized";
        model.validateOptions(options);
        model.validateCallback(callback);
    } catch(e) {
        var errorObj = model.createSyntheticError("RequestError", e.message);
        if(typeof(callback) == 'function') callback(errorObj);
        return;
    }

    socket.sessionId = "socket.io:" + (this._sessionIdCounter++);
    socket.sessionOptions = options;
    this._setupSession(socket.sessionId, callback);
}

//Invokes a method
//socket : Object
//      The socket.io socket
//channel : anything
//      Used to ensure the client calls the correct callback when a response
//      occurs. We use this instead of socket.io's first class support for
//      response callbacks because socket.io only allows you to call a
//      response callback once.
//service : string
//      The service name
//method : string
//      The method name
//args : array
//      The method arguments
SocketIOConnector.prototype._doInvoke = function(socket, channel, service, method, args) {
    try {
        if(!socket.sessionId) throw "session not initialized";
        model.validateNumber("channel", channel);
        model.validateInvocation(service, method, args);
    } catch(e) {
        var errorObj = model.createSyntheticError("RequestError", e.message);
        return socket.emit("response", channel, errorObj, undefined, false);
    }

    this._invoke(socket.sessionId, socket.sessionOptions, service, method, args, function(error, result, more) {
        socket.emit("response", channel, error, result, more);
    });
}

//Removes pending user requests when the socket is disconnected
//socket : Object
//      The socket.io socket
SocketIOConnector.prototype._doDisconnect = function(socket) {
    if(socket.sessionId) {
        this._teardownSession(socket.sessionId, function() {});
    }
}

module.exports = SocketIOConnector;
