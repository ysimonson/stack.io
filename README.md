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

The client is a library webapps can use for making stack.io calls. It uses
socket.io to communicate with the server, which in turn makes the actual
ZeroRPC requests.

For a complete example, checkout the dashboard, located in `apps/dashboard`.

### Client API ###

To create a new client, include the script in ./bin/client/stack.io.js in your
webapp. Then instantiate a new client:

    var client = new stack.IO(host, function(error) {
        console.error(error);
    });

Where `host` is the location of the stack.io server
(default `http://localhost:8080`). The second argument is a callback when the
initialization is complete, and it may include a fatal `error` message.

An example usage of the client:

    client.use("test", function(error, service) {
        test.sayHello("Joe", function(error, res) {
            console.log(res);
        });
    });

Methods:
 * `use(serviceName, callback)` - Prepares a service to be used. `serviceName`
   is the name of a service and `callback` is a function to call when the
   service is ready. `callback` should be of the form
   `function(error, context)` where `context` is the service's object on which
   you can make calls.
 * `login(credentials..., callback)` - Logs a user in. Credentials vary
   depending on the authentication middleware used. The default authenticator
   middleware requires a username and password. This is almost equivalent to:

       client.use("_stackio", function(error, context) {
            if(error) {
                callback(error);
            } else {
                context.login(credentials..., function(error, result) {
                    callback(error, result);
                });
            }
       });

   Where `_stackio` is a magic service that exposes built-in functions exposed
   by middleware, such as authentication.

 * `logout(callback)` - Logs the user out. `callback` is called when logout
   completes. This is almost equivalent to:

       client.use("_stackio", function(error, context) {
            if(error) {
                callback(error);
            } else {
                context.logout(function(error) {
                    callback(error);
                });
            }
       });

 * `services()` - Returns a list of services available.
 * `introspect(service, callback)` - Introspects on the methods available
   for a given `service`. `callback` is called when introspection is complete,
   and must be of the form `function(error, res)` where `res` is the result.

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

### Connectors ###

Connectors are objects that plug into the stack.io server to expose the
stack.io interface. Currently, we only have one connector, which exposes
stack.io via [socket.io](http://socket.io/), a library for real-time
communication with webapps that supports graceful degradation.

#### Connector API ####

TODO

### Middleware ###

TODO

#### Middleware API ####

## Registrar ##

TODO

## Authorizer ##

TODO