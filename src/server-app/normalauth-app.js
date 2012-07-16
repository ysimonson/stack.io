var stack = require("./stack"),
    express = require("express"),
    nopt = require("nopt"),
    fs = require("fs");

var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

var options = nopt(
    { "seed": [String, null] }
);

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
var seedConfig = null;

if(options.seed) {
    seedConfig = JSON.parse(fs.readFileSync(options.seed));
}

stack.useNormalAuth(server, /.+/, REGISTRAR_ENDPOINT, seedConfig);

//Add middleware necessary for making ZeroRPC calls
server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

//Start!
expressApp.listen(8080);
server.listen();