var _ = require("underscore");

//Compiles a list of permissions to regular expressions
exports.compilePermissions = function(permissions) {
    return permissions ? _.map(permissions, function(permission) {
        return {
            service: new RegExp(permission.service),
            method: new RegExp(permission.method)
        };
    }) : [];
}