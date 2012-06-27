var zerorpc = require("zerorpc"),
    util = require("util"),
    MiddlewareBase = require("../base"),
    model = require("../../model");

//Creates a new ZeroRPC backend
//config : object
//      The ZeroRPC configuration
function ZeroRPCBackend(config) {
    MiddlewareBase.call(this, config);
    
    this._services = {};
    this._clients = {};

    this._registrarConnection = this._createClient(config.registrarEndpoint);
    this._refreshServices(function() {});
}

util.inherits(ZeroRPCBackend, MiddlewareBase);

ZeroRPCBackend.prototype._createClient = function(endpoint, options) {
    var self = this;
    var client = new zerorpc.Client(options);

    client.on("error", function(error) {
        self.emit("error", error);
    });

    client.connect(endpoint);
    return client;
};

ZeroRPCBackend.prototype._refreshServices = function(callback) {
    var self = this;

    self._registrarConnection.invoke("services_verbose", function(error, res, more) {
        if(error) {
            self.emit("error", error);
        } else {
            self._services = res;
            self._services.registrar = self.config.registrarEndpoint;
            callback();
        }
    });
};

//Gets or creates a client for the session to the specified service
//session : string
//      The session
//connectionOptions : object
//      The connection-specific ZeroRPC options
//service : string
//      The name of the service
ZeroRPCBackend.prototype._getSessionClient = function(session, connectionOptions, service) {
    var clients = this._getSessionClients(session);
    var client = clients[service];

    //Create a new connection if one is not cached
    if(client === undefined) {
        client = this._createClient(this._services[service], connectionOptions);
        clients[service] = client;
    }

    return client;
};

//Gets the ZeroRPC clients associated with a session
//session : object
//      The session
//returns : object
//      Set of ZeroRPC clients, where the key is the service name and the
//      value is the client connection
ZeroRPCBackend.prototype._getSessionClients = function(session) {
    var clients = this._clients[session];

    if(clients === undefined) {
        clients = this._clients[session] = {};
    }

    return clients;
}

ZeroRPCBackend.prototype.invoke = function(request, response, next) {
    var self = this;

    var readyCallback = function() {
        if(request.service in self._services) {
            var client = self._getSessionClient(request.session, request.options, request.service);
            var invokeArgs = [request.method].concat(request.args);

            invokeArgs.push(function(error, result, more) {
                response.updateMulti({
                    error: error,
                    result: result,
                    more: more
                });

                next();
            });

            client.invoke.apply(client, invokeArgs);
        } else {
            var error = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
            response.update('error', error);
            next();
        }
    };

    if(request.service in self._services) {
        readyCallback();
    } else {
        self._refreshServices(readyCallback);
    }
};

ZeroRPCBackend.prototype.teardownSession = function(request, response, next) {
    var clients = this._getSessionClients(request.session);

    for(var clientId in clients) {
        clients[clientId].close();
    }

    delete this._clients[request.session];
    next();
};

module.exports = ZeroRPCBackend;
