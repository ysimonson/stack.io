var model = require("../../model"),
    oauth = require("oauth");

module.exports = function(configs) {
    var services = {};

    for(var serviceName in configs) {
        var config = configs[serviceName];

        if(config.version === "1.0") {
            var provider = new oauth.OAuth(config.requestUrl, config.accessUrl, config.consumerKey, config.consumerSecret, "1.0", null, "HMAC-SHA1");
        } else {
            throw new Error("Unknown OAuth version for service '" + serviceName + "': " + config.version);
        }

        services[serviceName] = provider;
    }

    var getLoginUrl = function(req, res, next) { 
        if(req.args.length !== 1) {
            var error = model.createSyntheticError("BadArgumentsError", "Bad arguments");
            res.update(error, undefined, false);
        } else if(!(req.args[0] in services)) {
            var error = model.createSyntheticError("BadArgumentsError", "Unknown OAuth service");
            res.update(error, undefined, false);
        } else {
            var serviceName = req.args[0];
            var provider = services[serviceName];
            var config = configs[serviceName];

            provider.getOAuthRequestToken(function(error, token, tokenSecret, oauthResults) {
                if(error) {
                    delete req.session.auth;
                    var errorObj = model.createSyntheticError("AuthenticationError", error);
                    res.update(errorObj, undefined, false);
                } else {
                    req.session.auth = {
                        state: "authenticating",
                        service: serviceName,
                        permissions: [],
                        provider: provider,
                        token: token,
                        tokenSecret: tokenSecret
                    };

                    var url = "https://api.twitter.com/oauth/authorize?oauth_token=" + token;
                    res.update(undefined, url, false);
                }
            });
        }
    };

    var login = function(req, res, next) {
        if(req.args.length !== 1) {
            var error = model.createSyntheticError("BadArgumentsError", "Bad arguments");
            res.update(error, undefined, false);
        } else {
            var verifier = req.args[0];
            var oldProvider = req.session.auth.provider;

            var provider = new oauth.OAuth(oldProvider._requestUrl,
                oldProvider._accessUrl,
                oldProvider._consumerKey,
                oldProvider._consumerSecret,
                oldProvider._version,
                oldProvider._authorize_callback,
                oldProvider._signatureMethod);

            provider.getOAuthAccessToken(req.session.auth.token, req.session.auth.tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results) {
                if(error) {
                    delete req.session.auth;
                    var errorObj = model.createSyntheticError("AuthenticationError", error);
                    res.update(errorObj, undefined, false);
                } else {
                    req.session.state = "authenticated";
                    req.session.permissions = configs[req.session.auth.service].permissions || [];
                    req.session.accessToken = accessToken;
                    req.session.accessTokenSecret = accessTokenSecret;
                    res.update(undefined, req.session.permissions, false);
                }
            });
        }
    };

    return function(req, res, next) {
        if(req.service === "_stackio") {
            if(req.method === "getLoginUrl") {
                getLoginUrl(req, res, next);
            } else if(req.method === "login") {
                login(req, res, next);
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
};
