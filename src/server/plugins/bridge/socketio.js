var io = require("socket.io");

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
        self.reply(callback, [error, user.id, user.permissions]);
    });
}

function invoke(channel, service, method, args, options) {
    var self = this;

    //TODO: validate all the things

    if(!self.user) {
        var error = { name: "NotAuthenticated", message: "Not authenticated", traceback: null };
        return self.emit("response", channel, error, null, false);
    } else if(!self.user.canInvoke(service, method)) {
        var error = { name: "NotPermitted", message: "Not permitted", traceback: null };
        return self.emit("response", channel, error, null, false);
    }

    self.backend.invoke(self.user, service, method, args, options, function(error, result, more) {
        self.emit("response", channel, error, result, more);
    }); 
}

function disconnect() {
    this.backend.removeUser(this.user);
}