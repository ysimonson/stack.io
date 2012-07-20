// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var util = require("./util"),
    oauth = require("oauth");

//Creates a base object for a new session
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

    //Create an OAuth object for each configured provider
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
                //OAuth 1.0 authentication

                //Grab the request token
                provider.getOAuthRequestToken(function(error, token, tokenSecret, oauthResults) {
                    if(error) {
                        util.loginError(req, res, error);
                    } else {
                        req.session.auth = initSession(serviceName, provider, config);
                        req.session.auth.token = token;
                        req.session.auth.tokenSecret = tokenSecret;

                        var url = config.authorizeUrl + "?oauth_token=" + token;
                        res.update(undefined, url, false);
                    }
                });
            } else {
                //OAuth 2.0 authentication

                //Grab the authorization url
                req.session.auth = initSession(serviceName, provider, config);
                var url = provider.getAuthorizeUrl({ response_type: "code" });
                res.update(undefined, url, false);
            }
        }
    };
}