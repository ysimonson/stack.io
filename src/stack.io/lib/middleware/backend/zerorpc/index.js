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

var zerorpc = require("zerorpc"),
    model = require("../../../model"),
    registrarCreator = require("./registrar");

function createServer(endpoint, context) {
    var server = new zerorpc.Server(context);

    server.on("error", function(error) {
        console.error("ZeroRPC server error:", error);
    });

    server.bind(endpoint);
    return server;
}

//Creates a new zerorpc client
//endpoint : string
//      The zeromq endpoint
//options : object
//      ZeroRPC options
function createClient(endpoint, options) {
    var client = new zerorpc.Client(options);

    client.on("error", function(error) {
        console.error("ZeroRPC client error:", error);
    });

    client.connect(endpoint);
    return client;
}

module.exports = function(registrarEndpoint) {
    //Cached ZeroRPC connections
    var clients = {};

    var registrar = registrarCreator(registrarEndpoint);
    createServer(registrarEndpoint, registrar);

    //Gets a connection to a given service for a user
    var getConnection = function(endpoint, session, service) {
        var connections = clients[session.id];

        if(connections === undefined) {
            clients[session.id] = connections = {};

            session.on("finish", function() {
                for(var service in clients[session.id]) {
                    clients[session.id][service].close();
                }

                delete clients[session.id];
            });
        }

        var connection = connections[service];

        if(!connection) {
            connection = createClient(endpoint, session.zerorpcOptions);
            connections[service] = connection;
        }

        return connection;
    };

    return function(req, res, next) {
        registrar.service(req.service, function(error, endpoint) {
            if(error || !endpoint) {
                //Return an error if the service does not exist
                var errorObj = model.createSyntheticError("ServiceDoesNotExistError", "Service '" + req.service + "' does not exist");
                res.update(errorObj, undefined, false);
            } else {
                //Invokes the call if possible
                var client = getConnection(endpoint, req.session, req.service);
                var invokeArgs = [req.method].concat(req.args);

                if (registrar._requireSession(req.service, req.method)) {
                    invokeArgs.unshift(req.session);
                }

                invokeArgs.push(function(error, zerorpcRes, more) {
                    res.update(error, zerorpcRes, more);
                });

                client.invoke.apply(client, invokeArgs);
            }
        });
    };
}
