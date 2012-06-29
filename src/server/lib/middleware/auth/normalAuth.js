var zerorpc = require("zerorpc"),
    _ = require("underscore"),
    model = require("../../model");

var SESSION_TIMEOUT = 30 * 60 * 1000;

function createClient(endpoint, options) {
    var self = this;
    var client = new zerorpc.Client(options);

    client.on("error", function(error) {
        console.error("error", error);
    });

    client.connect(endpoint);
    return client;
};

function createNormalAuthenticator(client) {
    return function(req, res, next) {
        if(req.service === "_stackio") {
            if(req.method === "login") {
                if(req.args.length !== 2) {
                    var error = model.createSyntheticError("BadArgumentsError", "Bad arguments");
                    res.update(error, undefined, false);
                } else {
                    var username = req.args[0], password = req.args[1];

                    client.invoke("login", username, password, function(error, permissions, more) {
                        if(!error) {
                            req.session.auth = {
                                username: username,
                                permissions: _.map(permissions, function(permission) {
                                    return {
                                        service: new RegExp(permission.service),
                                        method: new RegExp(permission.method),
                                    };
                                })
                            };
                        }

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
    };
}

module.exports = function(registrarEndpoint, readyCallback) {
    var registrarClient = createClient(registrarEndpoint);

    registrarClient.invoke("service", "auth", function(error, authEndpoint) {
        if(error) {
            readyCallback(error);
        } else {
            var authClient = createClient(authEndpoint);
            readyCallback(undefined, createNormalAuthenticator(authClient));
        }
    });
};