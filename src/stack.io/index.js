var model = require("./lib/model"),
    server = require("./lib/server"),
    client = require("./lib/client"),
    auth = require("./lib/middleware/auth");

var connectors = {
    "SocketIOConnector": "socketio"
};

var middleware = {
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
exports.useOAuth = auth.useOAuth;
exports.useNormalAuth = auth.useNormalAuth;

exports.ioServer = server.ioServer;
exports.io = client.ioClient;