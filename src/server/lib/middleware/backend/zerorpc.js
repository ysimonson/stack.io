var zerorpc = require("../util/zerorpc"),
    model = require("../../model");

module.exports = function(registrarEndpoint) {
    //Cached ZeroRPC connections
    var clients = {};

    //Gets a connection to a given service for a user
    var getConnection = function(serviceEndpoints, session, service) {
        var connections = clients[session.id];

        if(connections === undefined) {
            clients[session.id] = connections = {};

            session.on("finish", function() {
                for(var service in clients[session.id]) {
                    clients[session.id][service].close();
                }

                delete clients[session.id];
            });
        }

        var connection = connections[service];

        if(!connection) {
            connection = zerorpc.createClient(serviceEndpoints[service], session.zerorpcOptions);
            connections[service] = connection;
        }

        return connection;
    };

    return zerorpc.createRegistrarBasedMiddleware(registrarEndpoint, function(serviceEndpoints, req, res, next) {
        if(!(req.service in serviceEndpoints)) {
            //Return an error if the service does not exist
            var error = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
            res.update(error, undefined, false);
        } else {
            //Invokes the call if possible
            var client = getConnection(serviceEndpoints, req.session, req.service);
            var invokeArgs = [req.method].concat(req.args);

            invokeArgs.push(function(error, zerorpcRes, more) {
                res.update(error, zerorpcRes, more);
            });

            client.invoke.apply(client, invokeArgs);
        }
    });
}
