var model = require("./lib/model"),
    server = require("./lib/server");

var connectors = {
    "SocketIOConnector": "socketio"
};

var middleware = {
    normalAuthMiddleware: "auth/normalAuth",
    zerorpcMiddleware: "backend/zerorpc",
    printMiddleware: "debug/print",
    builtinsMiddleware: "etc/builtins"
};

for(var connectorName in connectors) {
    exports[connectorName] = require("./lib/connectors/" + connectors[connectorName])
}

for(var middlewareName in middleware) {
    exports[middlewareName] = require("./lib/middleware/" + middleware[middlewareName])
}

exports.createSyntheticError = model.createSyntheticError;
exports.Session = model.Session;
exports.Request = model.Request;
exports.Response = model.Response;
exports.IOServer = server.IOServer;
