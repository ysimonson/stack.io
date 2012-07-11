var stack = require("./stack"),
    express = require("express");

var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

//Create the express app
var expressApp = express.createServer();

expressApp.configure(function() {
    expressApp.use(express.bodyParser());
});

//Create the stack.io server
var server = new stack.IOServer();

//Use the socket.io connector
server.connector(new stack.SocketIOConnector(expressApp));

//Use normal (username+password) authentication
stack.useNormalAuth(server, /.+/, REGISTRAR_ENDPOINT);

//Add middleware necessary for making ZeroRPC calls
server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

//Start!
expressApp.listen(8080);
server.listen();