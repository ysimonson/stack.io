var util = require("./util"),
    oauth = require("oauth");

function initSession(serviceName, provider, config) {
    return {
        state: "authenticating",
        service: serviceName,
        permissions: [],
        provider: provider,
        config: config
    };
}

module.exports = function(configs) {
    var services = {};

    for(var serviceName in configs) {
        var config = configs[serviceName];

        if(config.version === "1.0") {
            var provider = new oauth.OAuth(config.requestUrl, config.accessUrl, config.consumerKey, config.consumerSecret, "1.0", null, "HMAC-SHA1");
        } else if(config.version === "2.0") {
            var provider = new oauth.OAuth2(config.clientId, config.clientSecret, config.baseSite, config.authorizePath, config.accessTokenPath);
        } else {
            throw new Error("Unknown OAuth version for service '" + serviceName + "': " + config.version);
        }

        services[serviceName] = provider;
    }

    return function(req, res, next) { 
        if(req.args.length !== 1) {
            util.badArgumentsError(res, "Bad arguments");
        } else if(!(req.args[0] in services)) {
            util.badArgumentsError(res, "Unknown OAuth service");
        } else {
            var serviceName = req.args[0];
            var provider = services[serviceName];
            var config = configs[serviceName];

            if(config.version === "1.0") {
                provider.getOAuthRequestToken(function(error, token, tokenSecret, oauthResults) {
                    if(error) {
                        util.loginError(req, res, error);
                    } else {
                        req.session.auth = initSession(serviceName, provider, config);
                        req.session.auth.token = token;
                        req.session.auth.tokenSecret = tokenSecret;

                        var url = "https://api.twitter.com/oauth/authorize?oauth_token=" + token;
                        res.update(undefined, url, false);
                    }
                });
            } else {
                req.session.auth = initSession(serviceName, provider, config);
                var url = provider.getAuthorizeUrl({ response_type: "code" });
                res.update(undefined, url, false);
            }
        }
    };
}