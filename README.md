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

For full details, checkout the architecture doc, located in
`doc/architecture.md`.

## Client ##

The client is a library that webapps can use for making stack.io calls. To
create a new client, include the script in `./bin/client/stack.io.js` in your
webapp. Then instantiate a new client:

    var client = new stack.IO(host, function(error) {
        console.error(error);
    });

From there, you can start using a service, e.g.:

    client.use("service_name", function(error, context) {
        context.sayHello("World", function(error, response, more) {
            console.log(error, response, more);
        });
    });

If you have authentication setup, you'll want to login before using a service.

An example login using normal (username+password) authentication:

    client.login("username", "password", function(error, permissions) {
        ...
    });

You can also do OAuth, if you run the server with OAuth authentication
middleware. See `./apps/oauth` for an example.

To logout, simply call `client.logout(callback)`.

Stack.io clients also have a couple of utility methods. To list available
services, call `client.services()`. To introspect on the methods of a
specific service, call `client.introspect("service_name", callback)`.

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

If you want to run a server programmatically, e.g. to change the port or add
custom middleware, check out the architecture doc, located in
`doc/architecture.md`.
