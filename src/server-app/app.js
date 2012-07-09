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

server.connector(new stack.SocketIOConnector(expressApp));

//server.middleware(/.+/, /.+/, /.+/, stack.normalAuthMiddleware(REGISTRAR_ENDPOINT));
server.middleware(/.+/, /.+/, /.+/, stack.oauthMiddleware({
    twitter: {
        version: "1.0",
        requestUrl: "https://api.twitter.com/oauth/request_token",
        accessUrl: "https://api.twitter.com/oauth/access_token",
        consumerKey: "zUKjO1SWVtFds3FSkwjg",
        consumerSecret: "VEQ8VfTVYPbUv35TLcBvjcEDSU3Bpbwq8hhsSq3Y",
        permissions: [
            {service: /twitter-test/, method: /allowed/}
        ]
    }
}));

server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
//server.middleware(/.+/, /.+/, /.+/, stack.printMiddleware);
server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

expressApp.listen(8080);
server.listen();