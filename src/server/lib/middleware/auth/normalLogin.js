var zerorpc = require("../util/zerorpc"),
    _ = require("underscore"),
    model = require("../../model");

//Compiles a list of permissions to regular expressions
function compilePermissions(permissions) {
    return permissions ? _.map(permissions, function(permission) {
        return {
            service: new RegExp(permission.service),
            method: new RegExp(permission.method),
        };
    }) : [];
}

//Creates a normal login middleware
//registrarEndpoint : string
//      The ZeroMQ endpoint of the registrar
module.exports = function(registrarEndpoint) {
    return zerorpc.createRegistrarBasedMiddleware(registrarEndpoint, function(serviceEndpoints, req, res, next) {
        var client = zerorpc.createClient(serviceEndpoints.auth);

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
    });
};
