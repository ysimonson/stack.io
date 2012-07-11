# Stack.io #

Stack.io is a distributed communication framework for web apps and server-side
processes.

Processes communicate using the [ZeroRPC](http://zerorpc.dotcloud.com) library.
We support the same semantics, including simple RPC calls and streamed
responses. In addition, stack.io provides service discovery, authentication
and authorization, and an express-like middleware engine for extending
functionality.

To build:

    git clone https://github.com/ysimonson/stack.io.git
    ./configure
    make

Stack.io comes with a number of built-in apps for debugging, testing and
stress testing.

To use the dashboard, which allows you to introspect on services:

    ./run dashboard

To use the stress tester:

    ./run stress

To run the unit tests:

    ./run test

After you start any of these apps, navigate your browser to
`http://localhost:8000`.

For full details, checkout the architecture doc, located in `doc/architecture.md`.

## Client ##

The client is a library webapps can use for making stack.io calls. It uses
socket.io to communicate with the server, which in turn makes the actual
ZeroRPC requests.

For a complete example, checkout the dashboard, located in `apps/dashboard`.

## Server ##

The stack.io server proxies requests that come from webapps and make the
appropriate backend calls. It also handles things like authentication and
authorization.

Servers have pluggable connectors and middleware. Connectors expose new methods
for browser-side users to make requests; currently our only connector uses
[socket.io](http://socket.io/). Middleware takes requests and conducts
transformations, or provides a response for the connector to send back.
Stack.io has a number of built-in middleware to handle debugging,
authentication, request proxying, etc.

You can create a new server programmatically, but for most use cases, the
built-in server apps should fulfill your needs. To start the server app after
stack.io has been built:

    node ./bin/server-app/normalauth-app

Or if you want to use OAuth:

    node ./bin/server-app/oauth-app

This will run stack.io on port 8080.

If the built-in server app does not fulfill your needs, you can create a
server programmatically. To create a new server:

    var stack = require("./stack");
    var server = new stack.IOServer();

Here's a full example:

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

    //Use the socket.io connector
    server.connector(new stack.SocketIOConnector(expressApp));

    //Use normal (username+password) authentication
    stack.useNormalAuth(server, /.+/, REGISTRAR_ENDPOINT);

    //Add middleware necessary for making ZeroRPC calls
    server.middleware(/.+/, /_stackio/, /.+/, stack.builtinsMiddleware);
    server.middleware(/.+/, /.+/, /.+/, stack.zerorpcMiddleware(REGISTRAR_ENDPOINT));

    //Start!
    expressApp.listen(8080);
    server.listen();