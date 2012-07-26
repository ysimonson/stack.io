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
    schema = require("./engine/schema"),
    seed = require("./engine/seed"),
    client = require("../../../client");

var AUTH_DB = "stackio_auth";

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
            client.expose("auth", api);
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
