var stack = require("./stack"),
    express = require("express"),
    fs = require("fs"),
    _ = require("underscore");

//This object exposes standard middleware names and an interface for
//instantiating the actual middleware in stack.io
var middlewareBuilders = {
    //Middleware for normal (username/password) authentication
    normalAuth: function(config, readyCallback) {
        stack.middleware.normalAuth(config.registrarEndpoint, function(error, middleware) {
            if(error) {
                console.error(error);
                process.exit(-1);
            } else {
                readyCallback(middleware);
            }
        });
    },

    //Middleware for ZeroRPC connectivity
    zerorpc: function(config, readyCallback) {
        stack.middleware.zerorpc.createFromRegistrar(config.registrarEndpoint, function(error, middleware) {
            if(error) {
                console.error(error);
                process.exit(-1);
            } else {
                readyCallback(middleware);
            }
        });
    },

    //Middleware for translating built-in methods to their actual ZeroRPC calls
    stackioBuiltinsTranslator: function(config, readyCallback) {
        readyCallback(function(req, res, next) {
            if(req.method === 'inspect') {
                //Service inspection

                if(req.args.length !== 1 || typeof(req.args[0]) !== 'string') {
                    var error = stack.createSyntheticError("BadArgumentsError", "Bad arguments");
                    res.update(error, undefined, false);
                } else {
                    req.service = req.args[0];
                    req.method = '_zerorpc_inspect';
                    req.args = [];
                }
            } else if(req.method === 'services') {
                //Service listing
                req.service = 'registrar';
                req.method = 'services';
            } else {
                //Unknown built-in
                var error = stack.createSyntheticError("BadMethodError", "Unknown method");
                res.update(error, undefined, false);
            }

            next();
        });
    },

    //Middleware for priting requests
    print: function(config, readyCallback) {
        readyCallback(stack.middleware.print);
    }
};

//Read the config file
var configSource = process.argv[process.argv.length - 1];

try {
    var config = JSON.parse(fs.readFileSync(configSource));
} catch(e) {
    console.error("Could not read config file:", e);
    process.exit(-1);
}

//Create the express app
var expressApp = express.createServer();

expressApp.configure(function() {
    expressApp.use(express.bodyParser());
});

//Create the stack.io server
var server = new stack.IOServer();

//Add the connectors
for(var connectorName in config.connectors) {
    var connectorConfig = config.connectors[connectorName];
    var ConnectorClass = stack.connectors[connectorName];

    if(!ConnectorClass) {
        console.error("Unknown connector: " + connectorName);
        process.exit(-1);
    }

    server.connector(new ConnectorClass(expressApp, connectorConfig));
}

//Add the middleware
var nextMiddleware = -1;

function loadNextMiddleware() {
    nextMiddleware++;

    if(nextMiddleware >= config.middleware.length) {
        expressApp.listen(config.port);
        server.listen();
        return;
    }

    var middlewareConfig = config.middleware[nextMiddleware];
    var builder = middlewareBuilders[middlewareConfig.name];

    if(!builder) {
        console.error("Unknown middleware:", middlewareConfig.name);
        process.exit(-1);
    }

    //Some of the middleware makes async calls, so the middleware is exposed
    //in a callback. Make sure we only add these middleware once at a time,
    //despite the asyncronous instantiation.
    builder(middlewareConfig, function(middleware) {
        server.middleware(
            new RegExp(middlewareConfig.connector),
            new RegExp(middlewareConfig.service),
            new RegExp(middlewareConfig.method),
            middleware
        );

        loadNextMiddleware();
    });
}

loadNextMiddleware();