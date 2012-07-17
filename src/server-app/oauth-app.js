var stack = require("./stack"),
    express = require("express");

var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

//Create the express app
var expressApp = express.createServer();

expressApp.configure(function() {
    expressApp.use(express.bodyParser());
});

//Create the stack.io server
var server = new stack.ioServer();

//Use the socket.io connector
server.connector(new stack.SocketIOConnector(expressApp));

//Use OAuth authentication
stack.useOAuth(server, /.+/, {
    twitter: {
        version: "1.0",
        requestUrl: "https://api.twitter.com/oauth/request_token",
        accessUrl: "https://api.twitter.com/oauth/access_token",
        authorizeUrl: "https://api.twitter.com/oauth/authorize",
        consumerKey: "zUKjO1SWVtFds3FSkwjg",
        consumerSecret: "VEQ8VfTVYPbUv35TLcBvjcEDSU3Bpbwq8hhsSq3Y",
        permissions: [
            {service: /twitter/, method: /.+/}
        ]
    },

    dotcloud: {
        version: "2.0",
        clientId: "95225716987d15b8ddced36b1d27b7",
        clientSecret: "0e59bad9ff52e3ba68c2d6dccfd9f9",
        baseSite: "https://oauth2.dotcloud.com/",
        authorizePath: "oauth2/authorize",
        accessTokenPath: "oauth2/token",
        permissions: [
            {service: /dotcloud/, method: /.+/}
        ]
    }
});

//Add middleware necessary for making ZeroRPC calls
server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

//Start!
expressApp.listen(8080);
server.listen();