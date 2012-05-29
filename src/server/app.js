var express = require("express"),
    backend = require("./backend"),
    fs = require("fs");

var configSource = process.argv[process.argv.length - 1];

try {
    var config = JSON.parse(fs.readFileSync(configSource));
} catch(e) {
    console.error("Could not read config file:", e);
    process.exit(1);
}

var authModule = require("./auth/auth-" + config.auth.type),
    app = express.createServer(),
    authorizer = new authModule.Authorizer(config.auth),
    service = new backend.ZeroRPCBackend(config.backend);

authorizer.on("error", function(error) {
    console.error("Authorizer error:", error);
});

service.on("error", function(error) {
    console.error("Backend error:", error);
});

app.use(express.bodyParser());

for(var pluginName in config.plugins) {
    var plugin = require("./plugins/" + pluginName);
    plugin(app, service, authorizer, config.plugins[pluginName] || {});
}

app.listen(config.port);