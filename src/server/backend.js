var zerorpc = require("zerorpc"),
    util = require("util"),
    events = require("events"),
    model = require("./model"),
    _ = require("underscore");

//Creates a new ZeroRPC backend
//config : object
//      The ZeroRPC configuration
function ZeroRPCBackend(config) {
    var self = this;

    self._services = {};
    self._clients = {};
    self._clientConfig = config.clientConfig;

    self._registrar = new zerorpc.Server({
        services: function(reply) {
            reply(null, self._services, false);
        },

        register: function(service, endpoint, reply) {
            //TODO: validation

            if(service in self._services) {
                var error = model.createSyntheticError("ServiceRegisteredError", "Service already registered");
                reply(error, undefined, false);
            } else {
                self._services[service] = endpoint;    
                reply(null, undefined, false);
            }
        }
    });

    self._registrar.bind(config.registrarEndpoint);

    //Proxy errors from the registrar service
    self._registrar.on("error", function(error) {
        self.emit("error", error);
    });
}

util.inherits(ZeroRPCBackend, events.EventEmitter);

//Gets the ZeroRPC clients associated with a user
//user : object
//      The user
//returns : object
//      Set of ZeroRPC clients, where the key is the service name and the
//      value is the client connection
ZeroRPCBackend.prototype._getUserClients = function(user) {
    var userClients = this._clients[user.id];

    if(userClients === undefined) {
        userClients = this._clients[user.id] = {};
    }

    return userClients;
}

//Gets or creates a client for ther user to the specified service
//user : object
//      The user
//serviceName : string
//      The name of the service
//serviceEndpoint : string
//      The endpoint to the service if a new client connection has to be made
ZeroRPCBackend.prototype._getClient = function(user, serviceName, serviceEndpoint) {
    var self = this;
    var userClients = self._getUserClients(user);
    var client = userClients[serviceName];

    //Create a new connection if one is not cached
    if(client === undefined) {
        client = new zerorpc.Client(self._clientConfig);
        client.connect(serviceEndpoint);

        client.on("error", function(error) {
            self.emit("error", error);
        });

        userClients[serviceName] = client;
    }

    return client;
};

//Invokes a method
//user : object
//      The user
//serviceName : string
//      The name of the service
//method : string
//      The name of the method
//args : array
//      The method arguments
//callback : function(error : object, response : anything, more : boolean)
//      The function to call when there is an update
ZeroRPCBackend.prototype.invoke = function(user, serviceName, method, args, callback) {
    var self = this;
    var serviceEndpoint = self._services[serviceName];

    if(serviceEndpoint === undefined) {
        var error = model.createSyntheticError("ServiceDoesNotExistError", "Service does not exist");
        return callback(error, undefined, false);
    }

    var client = this._getClient(user, serviceName, serviceEndpoint);
    var invokeArgs = [method].concat(args).concat([callback]);
    client.invoke.apply(client, invokeArgs);
};

//Removes a user's pending requests
//user : object
//      The user
ZeroRPCBackend.prototype.removeUser = function(user) {
    var userClients = this._getUserClients(user);

    for(var clientId in userClients) {
        userClients[clientId].close();
    }

    delete this._clients[user.id];
};

//Gets the list of services
//returns : array of strings
//      The list of services that have beeen registered
ZeroRPCBackend.prototype.services = function() {
    return _.keys(this._services);
};

exports.ZeroRPCBackend = ZeroRPCBackend;