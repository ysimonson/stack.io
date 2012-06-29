var stack = require("./stack"),
    express = require("express"),
    fs = require("fs"),
    _ = require("underscore");

var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

//Create the express app
var expressApp = express.createServer();

expressApp.configure(function() {
    expressApp.use(express.bodyParser());
});

//Create the stack.io server
var server = new stack.IOServer();
server.connector(new stack.SocketIOConnector(expressApp));

function addRegistrarConfiguredMiddleware(module, callback) {
    module.createFromRegistrar(REGISTRAR_ENDPOINT, function(error, middleware) {
        if(error) {
            console.error(error);
            process.exit(-1);
        } else {
            server.middleware(/.+/, /.+/, /.+/, middleware);
            callback();
        }
    });
}

addRegistrarConfiguredMiddleware(stack.normalAuthMiddleware, function() {
    server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
    server.middleware(/.+/, /.+/, /.+/, stack.printMiddleware);

    addRegistrarConfiguredMiddleware(stack.zerorpcMiddleware, function() {
        expressApp.listen(8080);
        server.listen();
    });
});