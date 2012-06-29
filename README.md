# Stack.io #

Stack.io is a distributed communication framework for web apps and server-side
processes.

Processes communicate using the [ZeroRPC](http://zerorpc.dotcloud.com) library.
We support the same semantics, including simple RPC calls and streamed
responses. In addition, stack.io provides service discovery, authentication
and authorization, and an express-like middleware engine for extending
functionality.

Stack.io is composed of:

 * A client-side library for webapps.
 * A server for receiving requests from webapps and proxying ZeroRPC calls.
 * A registrar for mapping service names to ZeroRPC/ZeroMQ endpoints.
 * An authorizer for authentication and authorization.

To build:

    git clone https://github.com/ysimonson/stack.io.git
    ./configure
    make

To run the unit tests:

    ./run test

... then navigate your browser to `http://localhost:8000`.

To use the dashboard:

    ./run dashboard

... and again, navigate your browser to `http://localhost:8000`.

## Client ##

TODO

## Server ##

The server proxies requests that come from webapps and make the appropriate
backend calls. You can create a new server programmatically, but for most use
cases, the built-in server app should fulfill your needs. To start the server
app after stack.io has been built:

    node ./bin/server-app/app

This will run stack.io on port 8080.

### Server API ###

To create a new server:

    var stack = require("./stack");
    var server = new stack.IOServer();

Events:

 * `error` - When an error occurs.

Methods:

 * `connector(connector)` - Adds a new connector
 * `middleware(connectorPattern, servicePattern, methodPattern, middleware)` -
   Adds a new middleware. When a new request comes in, `connectorPattern` is
   matched against the source request's connector, `servicePattern` is matched
   against the service name, and `methodPattern` is matched against the method
   name. If all matches pass, the middleware is called. `middleware` should be
   of the form `function(req, res, next)`, where `req` is a request object,
   `res` is a response object, and `next` is the next middleware to call when
   a request is complete.
 * `listen()` - Starts the server

Full example:

    var stack = require("./stack"),
        express = require("express");

    var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

    //Create the express app
    var expressApp = express.createServer();

    expressApp.configure(function() {
        expressApp.use(express.bodyParser());
    });

    //Create the stack.io server
    var server = new stack.IOServer();

    server.connector(new stack.SocketIOConnector(expressApp));

    server.middleware(/.+/, /.+/, /.+/, stack.normalAuthMiddleware(REGISTRAR_ENDPOINT));
    server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
    server.middleware(/.+/, /.+/, /.+/, stack.printMiddleware);
    server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

    expressApp.listen(8080);
    server.listen();

### Connector API ###

TODO

### Middleware API ###

TODO

## Registrar ##

TODO

## Authorizer ##

TODO