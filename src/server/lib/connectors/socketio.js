var io = require("socket.io"),
    validation = require("../validation"),
    model = require("../model"),
    util = require("util"),
    events = require("events");

//Creates a new socket.io connector
//expressApp : object
//      The express application to attach to
function SocketIOConnector(expressApp) {
    this.expressApp = expressApp;
    this._sessionIdCounter = 0;
}

util.inherits(SocketIOConnector, events.EventEmitter);

//The connector name
SocketIOConnector.prototype.name = "socketio";

//Starts the socket.io connector
SocketIOConnector.prototype.listen = function() {
    var self = this;
    var sio = io.listen(self.expressApp, {log: false});

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
//socket : object
//      The socket.io socket
//options : object
//      The ZeroRPC client options
//callback : function(error : object, user_id : number, permissions : array of
//           strings, services : array of strings)
//      The callback to call when the initialization is complete
SocketIOConnector.prototype._doInit = function(socket, options, callback) {
    try {
        if(socket.socketioSession) throw "session already initialized";
        validation.validateOptions(options);
        validation.validateCallback(callback);
    } catch(e) {
        var errorObj = model.createSyntheticError("RequestError", e.message);
        if(typeof(callback) == 'function') callback(errorObj);
        return;
    }
    
    //Attach a session to the socket
    socket.socketioSession = new model.Session({
        id: "socket.io:" + (this._sessionIdCounter++),
        zerorpcOptions: options
    });

    callback();
}

//Invokes a method
//socket : object
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
    var self = this;

    try {
        if(!socket.socketioSession) throw new Error("session not initialized");
        validation.validateNumber("channel", channel);
        validation.validateInvocation(service, method, args);
    } catch(e) {
        var errorObj = model.createSyntheticError("RequestError", e.message);
        console.log("ERROR", errorObj);
        return socket.emit("response", channel, errorObj, undefined, false);
    }

    var request = new model.Request(service, method, args, socket.socketioSession);
    var response = new model.Response();

    response.on("update", function(error, result, more) {
        socket.emit("response", channel, error, result, more);
    });

    self.emit("invoke", request, response);
}

//Called on socket disconnect
//socket : object
//      The socket.io socket
SocketIOConnector.prototype._doDisconnect = function(socket) {
    if(socket.socketioSession) {
        socket.socketioSession.finish();
    }
};

module.exports = SocketIOConnector;
