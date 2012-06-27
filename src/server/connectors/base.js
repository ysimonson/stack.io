var events = require("events"),
    util = require("util"),
    _ = require("underscore"),
    model = require("../model");

function Connector(app, config) {
    var self = this;
    self.app = app;
    self.config = config;
    self.middleware = [];
}

util.inherits(Connector, events.EventEmitter);

Connector.prototype._runMiddleware = function(middlewareCandidates, method, request, response, callback) {
    var self = this;
    var i = -1;

    var applicableMiddleware = _.filter(middlewareCandidates, function(middleware) {
        return method in middleware;
    });

    var next = function() {
        i++;

        if(response.error || i >= applicableMiddleware.length) {
            callback(response.error, response.result, response.more || false);
        } else {
            var middleware = applicableMiddleware[i];
            middleware[method].call(middleware, request, response, next);
        }
    };

    next();
};

Connector.prototype._invoke = function(session, options, service, method, args, callback) {
    var request = new model.ListenableModel({
        session: session,
        options: options,
        service: service,
        method: method,
        args: args
    });

    var response = new model.ListenableModel({error: null, result: null, more: null});

    var middlewareCandidates = _.filter(this.middleware, function(middleware) {
        return middleware.service.test(request.service) && middleware.method.test(request.method);
    });

    this._runMiddleware(middlewareCandidates, "invoke", request, response, callback);
};

Connector.prototype._setupSession = function(session, callback) {
    var request = new model.ListenableModel({session: session});
    var response = new model.ListenableModel({});
    this._runMiddleware(this.middleware, "setupSession", request, response, callback);
};

Connector.prototype._teardownSession = function(session, callback) {
    var request = new model.ListenableModel({session: session});
    var response = new model.ListenableModel({});
    this._runMiddleware(this.middleware, "teardownSession", request, response, callback);
};

Connector.prototype.registerMiddleware = function(middleware) {
    this.middleware.push(middleware);
};

Connector.prototype.start = function() {
    throw "Not implemented";
}

module.exports = Connector;