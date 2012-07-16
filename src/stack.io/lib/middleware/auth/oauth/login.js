var util = require("./util"),
    oauth = require("oauth");

module.exports = function(req, res, next) {
    if(req.args.length !== 2) {
        util.badArgumentsError(res, "Bad arguments");
    } else if(!req.session.auth) {
        util.badArgumentsError(res, "OAuth session was not initiated");
    } else {
        var config = req.session.auth.config;

        if(config.version === "1.0") {
            //OAuth 1.0 authentication

            var verifier = req.args[0];
            var redirectUrl = req.args[1];
            var oldProvider = req.session.auth.provider;

            //Create a new OAuth object based on the old provider
            var provider = new oauth.OAuth(oldProvider._requestUrl,
                oldProvider._accessUrl,
                oldProvider._consumerKey,
                oldProvider._consumerSecret,
                oldProvider._version,
                oldProvider._authorize_callback,
                oldProvider._signatureMethod);

            //Grab the access token
            provider.getOAuthAccessToken(req.session.auth.token, req.session.auth.tokenSecret, verifier, function(error, accessToken, accessTokenSecret, oauthResults) {
                if(error) {
                    util.loginError(req, res, error);
                } else {
                    req.session.auth.state = "authenticated";
                    req.session.auth.permissions = config.permissions || [];
                    req.session.auth.accessToken = accessToken;
                    req.session.auth.accessTokenSecret = accessTokenSecret;
                    res.update(undefined, req.session.auth.permissions, false);
                }
            });
        } else {
            //OAuth 2.0 authentication

            var code = req.args[0];
            var redirectUrl = req.args[1];
            var provider = req.session.auth.provider;

            var options = {
                "grant_type": "authorization_code",
                "redirect_uri": redirectUrl
            };

            //Grab the access token
            provider.getOAuthAccessToken(code, options, function(error, accessToken, refreshToken, oauthResults) {
                if(error) {
                    util.loginError(req, res, error);
                } else {
                    req.session.auth.state = "authenticated";
                    req.session.auth.permissions = config.permissions || [];
                    req.session.auth.accessToken = accessToken;
                    req.session.auth.refreshToken = refreshToken;
                    res.update(undefined, req.session.auth.permissions, false);
                }
            });
        }
    }
}