var model = require("./lib/model"),
    server = require("./lib/server");

var connectors = {
    socketio: "socketio"
};

var middleware = {
    normalAuth: "auth/normalAuth",
    zerorpc: "backend/zerorpc",
    print: "debug/print"
};

exports.connectors = {};
for(var connectorName in connectors) {
    exports.connectors[connectorName] = require("./lib/connectors/" + connectors[connectorName])
}

exports.middleware = {};
for(var middlewareName in middleware) {
    exports.middleware[middlewareName] = require("./lib/middleware/" + middleware[middlewareName])
}

exports.createSyntheticError = model.createSyntheticError;
exports.Session = model.Session;
exports.Request = model.Request;
exports.Response = model.Response;
exports.IOServer = server.IOServer;
