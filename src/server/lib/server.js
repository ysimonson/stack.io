var _ = require("underscore"),
    util = require("util"),
    events = require("events");

function IOServer() {
    this._connectors = {};
    this._middleware = [];
}

util.inherits(IOServer, events.EventEmitter);

IOServer.prototype.connector = function(connector) {
    if(connector.name in this._connectors) {
        throw new Error("Connector of the name '" + connector.name + "' already added");
    }

    this._connectors[connector.name] = {
        connector: connector,
        middleware: []
    };
};

IOServer.prototype.middleware = function(connector, service, method, middleware) {
    this._middleware.push({
        connector: connector,
        service: service,
        method: method,
        middleware: middleware
    });
};

IOServer.prototype._startConnector = function(connector) {
    var self = this;

    self._connectors[connector.name].middleware = _.filter(self._middleware, function(middleware) {
        return middleware.connector.test(connector.name);
    });

    connector.on("invoke", function(request, response) {
        var i = -1;
        var connectorMiddleware = self._connectors[connector.name].middleware;

        var applicableMiddleware = _.filter(connectorMiddleware, function(middleware) {
            return middleware.service.test(request.service) && middleware.method.test(request.method);
        });

        applicableMiddleware = _.map(applicableMiddleware, function(middleware) {
            return middleware.middleware;
        });

        var next = function() {
            i++;

            if(response.finished) {
                return;
            } else if(i < applicableMiddleware.length) {
                var middleware = applicableMiddleware[i];
                middleware(request, response, next);
            } else {
                response.finish();
            }
        };

        next();
    });

    connector.on("error", function(error) {
        self.emit("error", error);
    });

    connector.listen();
};

IOServer.prototype.listen = function() {
    for(var connectorName in this._connectors) {
        this._startConnector(this._connectors[connectorName].connector);
    }
};

exports.IOServer = IOServer;