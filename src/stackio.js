#!/usr/bin/env node

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

var stack = require(".."),
    express = require("express"),
    fs = require("fs"),
    _ = require("underscore"),
    optimist = require("optimist");

var DEFAULT_REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";
var DEFAULT_PORT = 8080;

var argv = optimist
    .usage("Starts the stack.io server")

    .describe("a", "Authentication mode (`oauth' or `normalauth')")
    .string("a")
    .default("a", "normalauth")
    .alias("a", "auth")

    .describe("r", "Sets the registrar endpoint (default " + DEFAULT_REGISTRAR_ENDPOINT + ")")
    .string("r")
    .default("r", DEFAULT_REGISTRAR_ENDPOINT)
    .alias("r", "registrar")

    .describe("d", "Enables debug mode")
    .boolean("d")
    .default("d", false)
    .alias("d", "debug")

    .describe("p", "Sets the port to run on (default " + DEFAULT_PORT + ")")
    .default("p", DEFAULT_PORT)
    .alias("p", "port")

    .describe("c", "Authentication config file")
    .string("c")
    .alias("c", "config")

    .argv;

//Validate config
if(argv.auth !== "oauth" && argv.auth !== "normalauth") {
    throw new Error("Unknown authentication type: " + argv.auth);
} else if(argv.auth === "oauth" && !argv.config) {
    throw new Error("OAuth authentication requires a config file");
}

try {
    var config = argv.config ? JSON.parse(fs.readFileSync(argv.config)) : undefined;
} catch(e) {
    throw new Error("Could not parse config file: " + e);
}

//Create the express app
var expressApp = express.createServer();

expressApp.configure(function() {
    expressApp.use(express.bodyParser());
});

//Create the stack.io server
var server = new stack.ioServer();

//Use the socket.io connector
server.connector(new stack.SocketIOConnector(expressApp));

//Add print middleware if debug is enabled
if(argv.debug) {
    server.middleware(/.+/, /.+/, /.+/, stack.printMiddleware);
}

//Add auth middleware
if(argv.auth == "oauth") {
    //Use OAuth authentication
    for(var service in config) {
        try {
            var permissions = config[service].permissions;

            for(var i=0; i<permissions.length; i++) {
                permissions[i].service = new RegExp(permissions[i].service);
                permissions[i].method = new RegExp(permissions[i].method);
            }
        } catch(e) {
            throw new Error("Could not regex compile permissions for service '" + service + "': " + e);
        }
    }

    stack.useOAuth(server, /.+/, config);
} else if(argv.auth == "normalauth") {
    //Use normal (username+password) authentication
    stack.useNormalAuth(server, /.+/, config);
} 

//Add middleware necessary for making ZeroRPC calls
server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(argv.registrar));

//Start!
expressApp.listen(argv.port);
server.listen();