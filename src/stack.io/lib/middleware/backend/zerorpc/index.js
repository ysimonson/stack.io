var zerorpc = require("zerorpc"),
    model = require("../../../model"),
    registrarCreator = require("./registrar");

function createServer(endpoint, context) {
    var server = new zerorpc.Server(context);

    server.on("error", function(error) {
        console.error("error", error);
    });

    server.bind(endpoint);
    return server;
}

//Creates a new zerorpc client
//endpoint : string
//      The zeromq endpoint
//options : object
//      ZeroRPC options
function createClient(endpoint, options) {
    var client = new zerorpc.Client(options);

    client.on("error", function(error) {
        console.error("error", error);
    });

    client.connect(endpoint);
    return client;
}

module.exports = function(registrarEndpoint) {
    //Cached ZeroRPC connections
    var clients = {};

    var registrar = registrarCreator(registrarEndpoint);
    createServer(registrarEndpoint, registrar);

    //Gets a connection to a given service for a user
    var getConnection = function(endpoint, session, service) {
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
            connection = createClient(endpoint, session.zerorpcOptions);
            connections[service] = connection;
        }

        return connection;
    };

    return function(req, res, next) {
        registrar.service(req.service, function(error, endpoint) {
            if(error || !endpoint) {
                //Return an error if the service does not exist
                var errorObj = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
                res.update(errorObj, undefined, false);
            } else {
                //Invokes the call if possible
                var client = getConnection(endpoint, req.session, req.service);
                var invokeArgs = [req.method].concat(req.args);

                invokeArgs.push(function(error, zerorpcRes, more) {
                    res.update(error, zerorpcRes, more);
                });

                client.invoke.apply(client, invokeArgs);
            }
        });
    };
}
