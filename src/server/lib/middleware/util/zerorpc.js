var zerorpc = require("zerorpc");

//Creates a new zerorpc client
//endpoint : string
//      The zeromq endpoint
//options : object
//      ZeroRPC options
function createClient(endpoint, options) {
    var self = this;
    var client = new zerorpc.Client(options);

    client.on("error", function(error) {
        console.error("error", error);
    });

    client.connect(endpoint);
    return client;
};

function createRegistrarBasedMiddleware(registrarEndpoint, callback) {
    //Client connected to the registrar
    var registrarClient = createClient(registrarEndpoint);

    //The service endpoints
    var serviceConfigs = {};
    var serviceConfigsLoaded = false;

    //Calls to execute when the registrar request is complete
    var queuedRequests = [];

    //Pull down the list of services
    registrarClient.invoke("services", true, function(error, res) {
        serviceConfigs = res;
        serviceConfigsLoaded = true;

        if(error) {
            console.error(error);
        } else {
            for(var i=0; i<queuedRequests.length; i++) {
                var args = queuedRequests[i];
                args.unshift(serviceConfigs);
                callback.apply(this, args);
            }

            delete queuedRequests;
        }
    });

    return function(req, res, next) {
        if(serviceConfigsLoaded) {
            callback(serviceConfigs, req, res, next);
        } else {
            queuedRequests.push([req, res, next]);
        }
    };
};

exports.createClient = createClient;
exports.createRegistrarBasedMiddleware = createRegistrarBasedMiddleware;