var _ = require("underscore"),
    model = require("../../../model");

//Validates that a request can be conducted by the user given his/her
//permissions
module.exports = function(req, res, next) {
    var permissions = req.session.auth ? req.session.auth.permissions : [];

    var canInvoke = _.any(permissions, function(permission) {
        return permission.service.test(req.service) && permission.method.test(req.method);
    });

    if(canInvoke) {
        if(req.session.auth.config.version === "1.0") {
            var oauthPayload = {
                version: "1.0",
                consumerKey: req.session.auth.config.consumerKey,
                consumerSecret: req.session.auth.config.consumerSecret,
                accessToken: req.session.auth.accessToken,
                accessTokenSecret: req.session.auth.accessTokenSecret
            };
        } else {
            var oauthPayload = {
                version: "2.0",
                accessToken: req.session.auth.accessToken,
                refreshToken: req.session.auth.refreshToken
            };
        }

        req.args.unshift(oauthPayload);
        next();
    } else {
        var error = model.createSyntheticError("NotPermittedError", "Not permitted");
        res.update(error, undefined, false);
    }
}