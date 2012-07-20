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