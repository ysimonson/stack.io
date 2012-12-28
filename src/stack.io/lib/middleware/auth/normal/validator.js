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
    model = require("../../../model"),
    apiCreator = require("./engine/api"),
    util = require("./util");

//Validates that a request can be conducted by the user given his/her
//permissions
module.exports = function(initialConfig) {
    var api = apiCreator("stackio_auth");
    var anonPermissions = null;

    return function(req, res, next) {
        var validate = function(permissions) {
            var canInvoke = _.any(permissions, function(permission) {
                return permission.service.test(req.service) && permission.method.test(req.method);
            });
            
            if(canInvoke) {
                next();
            } else {
                var error = model.createSyntheticError("NotPermittedError", "Not permitted");
                res.update(error, undefined, false);
            }
        };

        if(req.session.auth) {
            validate(req.session.auth.permissions);
        } else if(anonPermissions) {
            validate(anonPermissions);
        } else {
            api.getGroupPermissions("__anon__", function(error, res, more) {
                if(error) {
                    res.update(error, res, more);
                } else {
                    anonPermissions = util.compilePermissions(res);
                    validate(anonPermissions);
                }
            });
        }
    };
};