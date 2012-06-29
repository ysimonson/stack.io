var zerorpc = require("zerorpc"),
    model = require("../../model");

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

//Creates a new ZeroRPC backend given a service configuration
//serviceConfigs : object
//      A map of service names to 0mq endpoints
function create(serviceConfigs) {
    //Cached ZeroRPC connections
    var clients = {};

    //Creates a new session
    var newSession = function(session) {
        var newSession = clients[session.id] = {};

        session.on("finish", function() {
            for(var service in clients[session.id]) {
                clients[session.id][service].close();
            }

            delete clients[session.id];
        });

        return newSession;
    };

    //Creates a new client
    var newClient = function(req) {
        var client = createClient(serviceConfigs[req.service], req.session.zerorpcOptions);
        clients[req.service] = client;
        return client;
    };

    return function(req, res, next) {
        if(!(req.service in serviceConfigs)) {
            //Return an error if the service does not exist
            var error = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
            res.update(error, undefined, false);
        } else {
            //Invokes the call if possible
            var clientsContainer = clients[req.session.id] || newSession(req.session);
            var client = clientsContainer[req.service] || newClient(req);
            var invokeArgs = [req.method].concat(req.args);

            invokeArgs.push(function(error, zerorpcRes, more) {
                res.update(error, zerorpcRes, more);
            });

            client.invoke.apply(client, invokeArgs);
        }
    };
}

//Creates a new ZeroRPC backend from data returned by a registrar service
//registrarEndpoint : string
//      The 0mq endpoint for the registrar
//readyCallback : function(error : object, middleware : object)
//      The callback to run when the middleware is configured
function createFromRegistrar(registrarEndpoint, readyCallback) {
    var registrarClient = createClient(registrarEndpoint);

    registrarClient.invoke("services_verbose", function(error, serviceConfigs) {
        if(error) {
            readyCallback(error);
        } else {
            readyCallback(undefined, create(serviceConfigs));
        }
    });
};

exports.create = create;
exports.createFromRegistrar = createFromRegistrar;