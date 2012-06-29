var zerorpc = require("../util/zerorpc"),
    model = require("../../model");

module.exports = function(registrarEndpoint) {
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
    var newClient = function(serviceEndpoints, req) {
        var client = zerorpc.createClient(serviceEndpoints[req.service], req.session.zerorpcOptions);
        clients[req.service] = client;
        return client;
    };

    return zerorpc.createRegistrarBasedMiddleware(registrarEndpoint, function(serviceEndpoints, req, res, next) {
        if(!(req.service in serviceEndpoints)) {
            //Return an error if the service does not exist
            var error = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
            res.update(error, undefined, false);
        } else {
            //Invokes the call if possible
            var clientsContainer = clients[req.session.id] || newSession(req.session);
            var client = clientsContainer[req.service] || newClient(serviceEndpoints, req);
            var invokeArgs = [req.method].concat(req.args);

            invokeArgs.push(function(error, zerorpcRes, more) {
                res.update(error, zerorpcRes, more);
            });

            client.invoke.apply(client, invokeArgs);
        }
    });
}
