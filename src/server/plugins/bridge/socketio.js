var io = require("socket.io"),
    etc = require("../../etc");

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

    //TODO: validate token

    self.authorizer.authenticate(token, function(error, user) {
        self.user = user;

        if(error) {
            var errorObj = etc.createSyntheticError("NotAuthenticated", error);
            self.reply(callback, [errorObj, user.id, user.permissions]);
        } else {
            self.reply(callback, [undefined, user.id, user.permissions]);
        }
    });
}

function invoke(channel, service, method, args, options) {
    var self = this;

    //TODO: validate all the things

    if(!self.user) {
        var error = etc.createSyntheticError("NotAuthenticated", "Not authenticated");
        return self.emit("response", channel, error, null, false);
    } else if(!self.user.canInvoke(service, method)) {
        var error = etc.createSyntheticError("NotPermitted", "Not permitted");
        return self.emit("response", channel, error, null, false);
    }

    self.backend.invoke(self.user, service, method, args, options, function(error, result, more) {
        self.emit("response", channel, error, result, more);
    }); 
}

function disconnect() {
    this.backend.removeUser(this.user);
}