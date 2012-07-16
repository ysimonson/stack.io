var _ = require("underscore"),
    model = require("../../../model"),
    apiCreator = require("./engine/api"),
    schema = require("./engine/schema"),
    seed = require("./engine/seed"),
    client = require("../../../client");

var AUTH_DB = "stackio_auth";
var AUTH_ENDPOINT = "tcp://0.0.0.0:27616";

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
module.exports = function(initialConfig) {
    var api = apiCreator(AUTH_DB);

    if(initialConfig) {
        schema(AUTH_DB, function(error) {
            console.error(error);
        }, function() {
            seed(api, initialConfig);
        });
    }

    client.ioClient({}, function(error, client) {
        if(error) {
            console.error(error);
        } else {
            client.expose("auth", AUTH_ENDPOINT, api);
        }
    });

    return function(req, res, next) {
        if(req.args.length !== 2) {
            var error = model.createSyntheticError("BadArgumentsError", "Bad arguments");
            res.update(error, undefined, false);
        } else {
            var username = req.args[0], password = req.args[1];

            api.login(username, password, function(error, permissions, more) {
                req.session.auth = {
                    username: username,
                    permissions: compilePermissions(permissions)
                };

                res.update(error, permissions, more);
            });
        }
    };
};
