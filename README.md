# Stack.io #

Stack.io is a distributed communication framework for web apps and server-side
processes.

Communication among processes on the server-side is efficient because there is
no intermediate broker. From the client-side, requests come into a node.js
process via socket.io. Express-like middleware then processes these requests
to add things like authentication and authorization.

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

## Clients ##

### Webapps ###

To use stack.io from a webapp, include the script in `./bin/client/stack.io.js`
in your webapp. Then instantiate a new client:

    stack.io({}, function(error, client) {
        ...
    });

From there, you can start using a service, e.g.:

    client.use("test-service", function(error, context) {
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

[See the full API for webapps](https://github.com/ysimonson/stack.io/blob/master/doc/api/client-webapps.md).

### Node.js ###

To use stack.io from node.js, require the module and instantiate a new client:

    stack.io({}, function(error, client) {
        ...
    });

From there, you can start using a service, e.g.:

    client.use("test-service", function(error, context) {
        context.sayHello("World", function(error, response, more) {
            console.log(error, response, more);
        });
    });

The node.js client can also expose services, e.g.:

    client.expose("test-service", "tcp://127.0.0.1:4242", {
        sayHello: function(name, reply) {
            reply("Hello, " + name + "!");
        }
    });

This will expose the service `test-service` at the endpoint
`tcp://127.0.0.1:4242`.

Stack.io clients also have a couple of utility methods. To list available
services, call `client.services()`. To introspect on the methods of a
specific service, call `client.introspect("service_name", callback)`.

[See the full API for node.js](https://github.com/ysimonson/stack.io/blob/master/doc/api/client-node.md).

### Python ###

To use stack.io from python, import the module and instantiate a new client:

    client = stackio.StackIO()

From there, you can start using a service, e.g.:

    test = client.use("test-service")
    print test.say_hello("World")

The python client can also expose services, e.g.:

    class TestService(object):
        def say_hello(name):
            return "Hello, %s!" % name

    test.expose("test-service", "tcp://127.0.0.1:4242", TestService())

This will expose the service `test-service` at the endpoint
`tcp://127.0.0.1:4242`.

Stack.io clients also have a couple of utility methods. To list available
services, call `client.services()`. To introspect on the methods of a
specific service, call `client.introspect("service_name")`.

[See the full API for python](https://github.com/ysimonson/stack.io/blob/master/doc/api/client-python.md).

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
custom middleware, check out the [server API](https://github.com/ysimonson/stack.io/blob/master/doc/api/server.md).
