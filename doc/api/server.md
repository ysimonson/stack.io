## Server API ##

If the built-in server app does not fulfill your needs, you can create a
server programmatically:

    var stack = require("stack.io");
    var server = new stack.ioServer();

Here's a full example:

    var stack = require("stack.io"),
        express = require("express"),
        nopt = require("nopt"),
        fs = require("fs");

    var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

    var options = nopt(
        { "seed": [String, null] }
    );

    //Create the express app
    var expressApp = express.createServer();

    expressApp.configure(function() {
        expressApp.use(express.bodyParser());
    });

    //Create the stack.io server
    var server = new stack.ioServer();

    //Use the socket.io connector
    server.connector(new stack.SocketIOConnector(expressApp));

    //Use normal (username+password) authentication
    var seedConfig = null;

    if(options.seed) {
        seedConfig = JSON.parse(fs.readFileSync(options.seed));
    }

    stack.useNormalAuth(server, /.+/, seedConfig);

    //Add middleware necessary for making ZeroRPC calls
    server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
    server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

    //Start!
    expressApp.listen(8080);
    server.listen();

Events:
 * `error` - When an error occurs.

Methods:
 * `connector(connector)` - Adds a new connector.
 * `middleware(connectorPattern, servicePattern, methodPattern, middleware)` -
   Adds a new middleware. When a new request comes in, `connectorPattern` is
   matched against the source request's connector, `servicePattern` is matched
   against the service name, and `methodPattern` is matched against the method
   name. If all matches pass, the middleware is called. `middleware` should be
   of the form `function(req, res, next)`, where `req` is a request object,
   `res` is a response object, and `next` is the next middleware to call when
   a request is complete.
 * `listen()` - Starts the server.

### Connectors ###

Connectors are objects that plug into the stack.io server to expose the
stack.io interface. Currently, we only have one connector, which exposes
stack.io via [socket.io](http://socket.io/), a library for real-time
communication with webapps that supports graceful degradation.

### Middleware ###

Middleware are functions that take a request and do some processing on it.
Middleware can return results, transform requests, etc.; they largely resemble
express middleware in that they are called one at a time, in a chain.

Middleware should follow the form `function(req, res, next)` where `req` is a
request object, `res` is a response object, and `next` is called by the
middleware when it is done.

Examples of middleware are in `./src/server/middleware`.

stack.io includes a few built-in middleware:

 * `stack.zerorpcMiddleware` - Proxies requests out on ZeroRPC. You could
   hypothetically swap this out for something that used another RPC engine,
   but why would you do that? This is obviously enabled in the default server
   application.
 * `stack.printMiddleware` - Prints out requests as they occur to console.log.
 * `stack.builtinsMiddleware` - Converts functions in the magic service
   `_stackio` to their actual calls. This is enabled in the default server
   application, and is necessary for proper functionality unless you've made
   some interesting hacks to the stack.io client.

There is also authentication/authorization middleware. Because these
facilities actually install several middleware, we have made the convience
methods `useNormalAuth` and `useOAuth`. Note that you can only use one
authentication method per server instance.

A final note on middleware. If you write a middleware that needs to directly
interact with a client, you can listen for function calls on the magic service
`_stackio`. For example, authentication/authorization middleware intercepts
calls to `login` and `logout` in `_stackio` to perform their functionality.
Additionally, introspection is exposed as the method `_stackio.introspect`, and
service listing is exposed as `_stackio.services`. A middleware then converts
these calls to their actual ones. This is so that the calls are usable even
outside of an authenticated session.
