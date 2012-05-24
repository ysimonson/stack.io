var zpcServer = require("./lib/zerorpc/server"),
    zpcClient = require("./lib/zerorpc/client"),
    util = require("util"),
    events = require("events");

function ZeroRPCBackend(config) {
    var self = this;

    self._services = {};
    self._clients = {};
    self._clientConfig = config.clientConfig;

    self._registrar = new zpcServer.Server(config.registrarConfig);
    self._registrar.bind(config.registrarEndpoint);

    self._registrar.on("error", function(error) {
        self.emit("error", error);
    });

    self._registrar.expose({
        services: function(cb) {
            cb(null, self._services, false);
        },

        register: function(cb, service, endpoint) {
            //TODO: validation
            self._services[service] = endpoint;
            cb(null, undefined, false);
        }
    });
}

util.inherits(ZeroRPCBackend, events.EventEmitter);

ZeroRPCBackend.prototype._getUserClients = function(user) {
    var userClients = this._clients[user.id];

    if(userClients === undefined) {
        userClients = this._clients[user.id] = {};
    }

    return userClients;
}

ZeroRPCBackend.prototype._getClient = function(user, serviceName, serviceEndpoint) {
    var self = this;
    var userClients = self._getUserClients(user);
    var client = userClients[serviceName];

    if(client === undefined) {
        client = new zpcClient.Client(self._clientConfig);
        client.connect(serviceEndpoint);

        client.on("error", function(error) {
            self.emit("error", error);
        });

        userClients[serviceName] = client;
    }

    return client;
};

ZeroRPCBackend.prototype.invoke = function(user, serviceName, method, args, options, callback) {
    var self = this;
    var serviceEndpoint = self._services[serviceName];

    if(serviceEndpoint === undefined) {
        var error = { name: "ServiceDoesNotExist", message: "Service does not exist", traceback: null };
        return callback(error, undefined, false);
    }

    var client = this._getClient(user, serviceName, serviceEndpoint);
    client.invoke(method, args, options, callback);
};

ZeroRPCBackend.prototype.removeUser = function(user) {
    var userClients = this._getUserClients(user);

    for(var clientId in userClients) {
        userClients[clientId].close();
    }

    delete this._clients[user.id];
};

exports.ZeroRPCBackend = ZeroRPCBackend;