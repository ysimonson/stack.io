var stack = require("./stack"),
    express = require("express"),
    fs = require("fs"),
    _ = require("underscore");

var middlewareBuilders = {
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

    zerorpc: function(config, readyCallback) {
        stack.middleware.zerorpc(config.registrarEndpoint, function(error, middleware) {
            if(error) {
                console.error(error);
                process.exit(-1);
            } else {
                readyCallback(middleware);
            }
        });
    },

    stackioBuiltinsTranslator: function(config, readyCallback) {
        readyCallback(function(req, res, next) {
            if(req.method === 'inspect') {
                if(req.args.length !== 1 || typeof(req.args[0]) !== 'string') {
                    res.error = stack.createSyntheticError("BadArgumentsError", "Bad arguments");
                    res.finish();
                } else {
                    req.service = req.args[0];
                    req.method = '_zerorpc_inspect';
                    req.args = [];
                }
            } else if(req.method === 'services') {
                req.service = 'registrar';
                req.method = 'services';
            } else {
                res.error = stack.createSyntheticError("BadMethodError", "Unknown method");
                res.finish();
            }

            next();
        });
    },

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

var server = new stack.IOServer();

for(var connectorName in config.connectors) {
    var connectorConfig = config.connectors[connectorName];
    var ConnectorClass = stack.connectors[connectorName];

    if(!ConnectorClass) {
        console.error("Unknown connector: " + connectorName);
        process.exit(-1);
    }

    server.connector(new ConnectorClass(expressApp, connectorConfig));
}

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