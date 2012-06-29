var zerorpc = require("../util/zerorpc"),
    _ = require("underscore"),
    model = require("../../model");

var SESSION_TIMEOUT = 30 * 60 * 1000;

function compilePermissions(permissions) {
    return permissions ? _.map(permissions, function(permission) {
        return {
            service: new RegExp(permission.service),
            method: new RegExp(permission.method),
        };
    }) : [];
}

module.exports = function(registrarEndpoint) {
    return zerorpc.createRegistrarBasedMiddleware(registrarEndpoint, function(serviceEndpoints, req, res, next) {
        if(req.service === "_stackio") {
            var client = zerorpc.createClient(serviceEndpoints.auth);

            if(req.method === "login") {
                if(req.args.length !== 2) {
                    var error = model.createSyntheticError("BadArgumentsError", "Bad arguments");
                    res.update(error, undefined, false);
                } else {
                    var username = req.args[0], password = req.args[1];

                    client.invoke("login", username, password, function(error, permissions, more) {
                        req.session.auth = {
                            username: username,
                            permissions: compilePermissions(permissions)
                        };

                        res.update(error, permissions, more);
                    });
                }
            } else if(req.method === "logout") {
                delete req.session.auth;
                res.update(undefined, undefined, false);
            } else {
                next();
            }
        } else {
            var permissions = req.session.auth ? req.session.auth.permissions : [];

            var canInvoke = _.any(permissions, function(permission) {
                return permission.service.test(req.service) && permission.method.test(req.method);
            });

            if(canInvoke) {
                next();
            } else {
                var error = model.createSyntheticError("NotPermittedError", "Not permitted");
                res.update(error, undefined, false);
            }
        }
    });
};
