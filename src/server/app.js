var express = require("express"),
    fs = require("fs"),
    _ = require("underscore");

//Read the config file
var configSource = process.argv[process.argv.length - 1];

try {
    var config = JSON.parse(fs.readFileSync(configSource));
} catch(e) {
    console.error("Could not read config file:", e);
    process.exit(1);
}

//Create the express app
var app = express.createServer();

app.configure(function() {
    app.use(express.bodyParser());
});

//Load the middleware
var middleware = _.map(config.middleware, function(config) {
    var MiddlewareClass = require(config.path);
    var middleware = new MiddlewareClass(config);

    middleware.on("error", function(error) {
        console.error("Middleware error:", error);
    });

    return middleware;
});

//Instantiate the connectors, passing in the middleware
for(var i=0; i<config.connectors.length; i++) {
    var connectorConfig = config.connectors[i];
    var ConnectorClass = require(connectorConfig.path);
    var connector = new ConnectorClass(app, connectorConfig);

    var relevantMiddleware = _.filter(middleware, function(middleware) {
        return middleware.connector.test(connectorConfig.path);
    });

    for(var j=0; j<relevantMiddleware.length; j++) {
        connector.registerMiddleware(relevantMiddleware[j]);
    }

    connector.on("error", function(error) {
        console.error("Connector error:", error);
    });

    connector.start();
}

//Start!
app.listen(config.port);