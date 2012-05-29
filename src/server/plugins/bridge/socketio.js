var io = require("socket.io"),
    model = require("../../model");

module.exports = function(app, backend, authorizer, config) {
    var sio = io.listen(app, {log: false});

    sio.sockets.on("connection", function(socket) {
        socket.user = authorizer.unauthenticated();
        socket.expressApp = app;
        socket.backend = backend;
        socket.authorizer = authorizer;

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

function init(token, callback) {
    var self = this;

    try {
        model.validateAuthentication(token);

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

function disconnect() {
    this.backend.removeUser(this.user);
}