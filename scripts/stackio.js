var stack = require(".."),
    express = require("express"),
    fs = require("fs"),
    _ = require("underscore"),
    program = require("commander");

var DEFAULT_REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

//Create the express app
var expressApp = express.createServer();

expressApp.configure(function() {
    expressApp.use(express.bodyParser());
});

//Create the stack.io server
var server = new stack.ioServer();

//Use the socket.io connector
server.connector(new stack.SocketIOConnector(expressApp));

//Add print middleware if debug is enabled
if(program.debug) {
    server.middleware(/.+/, /.+/, /.+/, stack.printMiddleware);
}

var authType = null;
var configFile = null;

program
    .version("0.0.1")
    .description("Starts the stack.io server")
    .option("-r", "--registrar <endpoint>", "Set the ZeroMQ endpoint of the registrar; defaults to " + DEFAULT_REGISTRAR_ENDPOINT)
    .option("-d", "--debug", "Enable debugging mode to print requests as they come in");

program.command("oauth <config>")
    .description("Uses OAuth")
    .action(function(configFileArg) {
        authType = "oauth";
        configFile = configFileArg;
    });

program.command("normalauth [<config>]")
    .description("Uses normal (username + password) authentication")
    .action(function(configFileArg) {
        authType = "normalauth";
        configFile = configFileArg;
    });

program.parse(process.argv);

//Validate config
if(!authType) {
    throw new Error("No authentication type specified");
} else if(authType === "oauth" && !configFile) {
    throw new Error("OAuth authentication requires a config file");
}

try {
    var config = configFile ? JSON.parse(fs.readFileSync(configFile)) : undefined;
} catch(e) {
    throw new Error("Could not parse config file: " + e);
}

if(program.debug) {
    server.middleware(stack.printMiddleware());
}

//Add auth middleware
if(authType == "oauth") {
    //Use OAuth authentication
    for(var service in config) {
        try {
            var permissions = config[service].permissions;

            for(var i=0; i<permissions.length; i++) {
                permissions[i].service = new RegExp(permissions[i].service);
                permissions[i].method = new RegExp(permissions[i].method);
            }
        } catch(e) {
            throw new Error("Could not regex compile permissions for service '" + service + "': " + e);
        }
    }

    stack.useOAuth(server, /.+/, config);
} else if(authType == "normalauth") {
    //Use normal (username+password) authentication
    stack.useNormalAuth(server, /.+/, config);
} 

//Add middleware necessary for making ZeroRPC calls
server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(program.registrar || DEFAULT_REGISTRAR_ENDPOINT));

//Start!
expressApp.listen(8080);
server.listen();