var zerorpc = require("zerorpc"),
    util = require("util"),
    MiddlewareBase = require("../base"),
    model = require("../../model");

function NormalAuthenticator(config) {
    MiddlewareBase.call(this, config);
    this._authenticated = {};
}

util.inherits(NormalAuthenticator, MiddlewareBase);

NormalAuthenticator.prototype.invoke = function(request, response, next) {
    if(request.service === "auth" && request.method === "auth") {
        next();
    } else {
        
    }
};

NormalAuthenticator.prototype.teardownSession = function(request, response, next) {
    delete this._authenticated[request.session];
    next();
};

module.exports = NormalAuthenticator;