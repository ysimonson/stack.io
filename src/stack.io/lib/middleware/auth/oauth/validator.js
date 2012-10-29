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
};