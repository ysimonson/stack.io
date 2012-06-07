var io = require("socket.io"),
    model = require("../../model");

module.exports = function(app, backend, authorizer, config) {
    var sio = io.listen(app, {log: false});

    sio.sockets.on("connection", function(socket) {
        socket.user = authorizer.unauthenticated();
        socket.expressApp = app;
        socket.backend = backend;
        socket.authorizer = authorizer;

        //Helper method to reply to a request, or create an error event if
        //that fails
        socket.reply = function(callback, args) {
            if(typeof(callback) == "function") {
                callback.apply(this, args);
            } else {
                socket.emit("error", "No callback defined");
            }
        };

        socket.on("init", init);
        socket.on("invoke", invoke);
        socket.on("disconnect", disconnect);
    });
};

//Initializes a new session
//token : string
//      The authentication token
//callback : function(error : object, user_id : number, permissions : array of
//           strings, services : array of strings)
//      The callback to call when the initialization is complete
function init(token, callback) {
    var self = this;

    try {
        //Validate the request
        model.validateAuthentication(token);

        //Perform authentication
        self.authorizer.authenticate(token, function(error, user) {
            self.user = user;

            if(error) {
                var errorObj = model.createSyntheticError("NotAuthenticatedError", error);
                self.reply(callback, [errorObj, null, null, null]);
            } else {
                var args = [undefined, user.id, user.permissions, self.backend.services()];
                self.reply(callback, args);
            }
        });
    } catch(e) {
        console.error(e);
        var errorObj = model.createSyntheticError("RequestError", e.message);
        self.reply(callback, [e, null, null, null]);
    }
}

//Invokes a method
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
//options : object
//      ZeroRPC arguments
function invoke(channel, service, method, args, options) {
    var self = this;

    try {
        model.validateInvocation(service, method, args, options);

        if(!self.user) {
            var error = model.createSyntheticError("NotAuthenticatedError", "Not authenticated");
            return self.emit("response", channel, error, null, false);
        } else if(!self.user.canInvoke(service, method)) {
            var error = model.createSyntheticError("NotPermittedError", "Not permitted");
            return self.emit("response", channel, error, null, false);
        }

        self.backend.invoke(self.user, service, method, args, options, function(error, result, more) {
            //if(error) console.log("ASDASDA", error, result, more);
            self.emit("response", channel, error, result, more);
        }); 
    } catch(e) {
        console.error("Request error:", e);
        var errorObj = model.createSyntheticError("RequestError", e.message);
        self.emit("response", channel, errorObj, undefined, false);
    }
}

//Removes pending user requests when the socket is disconnected
function disconnect() {
    this.backend.removeUser(this.user);
}