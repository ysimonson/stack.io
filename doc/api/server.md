## Server API ##

If the built-in server app does not fulfill your needs, you can create a
server programmatically:

    var stack = require("stack.io");
    var server = new stack.ioServer();

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

### Internal Semantics ###

The stack.io server uses the notion of connectors and middleware for handling
requests. Connectors are objects that expose the stack.io interface in a new
way to web clients. When a connector receives an invocation request from a
client, it creates a request and response object, and pass them off to
middleware. The middleware then does its work before passing off the final
result to the connector. The connector can then respond to the client.

#### Models ####

Connectors and middleware use a few common models for communication between
connectors and middleware. These are defined in `./src/stack.io/lib/model.js`.

##### Request Objects #####

These objects encapsulate a request from a client.

Constructor: `new Request(service, method, args, session)`, where `service`
is the service name, `method` is the method name, `args` are the invocation
arguments and `session` is the user session object.

Properties:
 * `service` - The service name
 * `method` - The method name
 * `args` - The invocation arguments
 * `session` - The request session

##### Session Objects #####

Constructor: `new Session(initialValues)`, where `initialValues` is an object
containing initial session keys and values.

Events:
 * `finish` - Emitted when the session is closed

##### Response Objects #####

Constructor: `new Response()`

Events:
 * `finish` - Emitted when the response is finished, i.e. when there are no
   more updates.
 * `update` - Emitted when there is a new update. Passes `error`, `result`,
   and `more`.

Methods:
 * `update(error, result, more)` - Called when there is a new update. Emits an
   `update` event, and a `finish` event if `more` is false.

#### Connectors ####

Currently, we only have a single connector that provides support for
[socket.io](http://socket.io/)-based connections, a library for real-time
communication with webapps that supports graceful degradation. It would be
possible, to, say, add a connector that exposes stack.io through a RESTful
interface.

Connectors are `EventEmitter` objects. They must have a property called `name`
which is the name of the connector. When middleware is added, the connector
pattern matches against this `name`. Connectors must also have a `listen`
function that takes no arguments. This is called when the server starts
listening.

When a request is made, a connector must emit an `invoke` event, passing a
request and response object. The connector can then listen for the response's
`update` event to send an update back to the client.

#### Middleware ####

Middleware are functions that take a request and do some processing on it.
Middleware can return results, transform requests, etc.; they largely resemble
express middleware in that they are called one at a time, in a chain.

Middleware should follow the form `function(req, res, next)` where `req` is a
request object, `res` is a response object, and `next` is called by the
middleware when it is done.

Examples of middleware are in `./src/stack.io/lib/middleware`.

stack.io includes a few built-in middleware:

 * `stack.zerorpcMiddleware` - Proxies requests out on ZeroRPC. You could
   hypothetically swap this out for something that used another RPC engine,
   but why would you do that? This is obviously enabled in the default server
   application.
 * `stack.printMiddleware` - Prints out requests as they occur to console.log.
 * `stack.builtinsMiddleware` - Converts functions in the magic service
   `_stackio` to their actual calls. This is enabled in the default server
   application, and is necessary for proper functionality.

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
these calls to their actual ones. By convention, calls on `_stackio` are
allowed even outside of an authenticated context.
