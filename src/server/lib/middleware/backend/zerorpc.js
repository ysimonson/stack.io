var zerorpc = require("zerorpc"),
    model = require("../../model");

function createClient(endpoint, options) {
    var self = this;
    var client = new zerorpc.Client(options);

    client.on("error", function(error) {
        console.error("error", error);
    });

    client.connect(endpoint);
    return client;
};

function createZerorpcBackend(serviceConfigs) {
    var clients = {};

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

    var newClient = function(req) {
        var client = createClient(serviceConfigs[req.service], req.session.zerorpcOptions);
        clients[req.service] = client;
        return client;
    };

    return function(req, res, next) {
        if(!(req.service in serviceConfigs)) {
            var error = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
            res.update(error, undefined, false);
        } else {
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

module.exports = function(registrarEndpoint, readyCallback) {
    var registrarClient = createClient(registrarEndpoint);

    registrarClient.invoke("services_verbose", function(error, serviceConfigs) {
        if(error) {
            readyCallback(error);
        } else {
            readyCallback(undefined, createZerorpcBackend(serviceConfigs));
        }
    });
};
