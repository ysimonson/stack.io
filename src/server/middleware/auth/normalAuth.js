var zerorpc = require("zerorpc"),
    util = require("util"),
    MiddlewareBase = require("../base"),
    model = require("../../model"),
    _ = require("underscore");

function NormalAuthenticator(config) {
    MiddlewareBase.call(this, config);
    this._authenticated = {};
}

util.inherits(NormalAuthenticator, MiddlewareBase);

var WHITELIST = [
    {service: "registrar", method: "_zerorpc_inspect"},
    {service: "registrar", method: "services"}
];

function inWhitelist(request) {
    return _.any(WHITELIST, function(item) {
        return request.service === item.service && request.method === item.method;
    });
}

NormalAuthenticator.prototype.invoke = function(request, response, next) {
    var self = this;

    if(request.service === "auth" && request.method === "auth") {
        response.on("update", function() {
            if(response.error) {
                delete self._authenticated[request.session];
            } else if(response.result) {
                self._authenticated[request.session] = _.map(response.result, function(permission) {
                    return {
                        service: new RegExp(permission.service),
                        method: new RegExp(permission.method)
                    };
                });
            }
        });
    } else if(!inWhitelist(request)) {
        var permissions = self._authenticated[request.session] || [];

        var canInvoke = _.any(permissions, function(permission) {
            return permission.service.test(request.service)
                && permission.method.test(request.method);
        });

        if(!canInvoke) {
            response.update("error", model.createSyntheticError("NotPermittedError", "Not permitted"));
        }
    }

    next();
};

NormalAuthenticator.prototype.teardownSession = function(request, response, next) {
    delete this._authenticated[request.session];
    next();
};

module.exports = NormalAuthenticator;