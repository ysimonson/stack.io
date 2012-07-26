# Node.js API #

To instantiate a new client:

    var stack = require("stack.io");

    stack.io(options, function(error, client) {
        ...
    });

Allowable `options`:

 * `registrar` (string) - The ZeroMQ endpoint of the registrar
   (defaults to `tcp://localhost:27615`).
 * `timeout` (number) - The timeout for function calls in seconds.

The callback is executed when initialization is complete, and will include
either a fatal `error` message, or the `client` object.

Methods:
 * `expose(serviceName, context)` - Exposes a new stack.io service,
   where `serviceName` is the name of the service and `context` is the object
   to expose.
 * `use(serviceName, callback)` - Prepares a service to be used. `serviceName`
   is the name of a service and `callback` is a function to call when the
   service is ready. `callback` should be of the form
   `function(error, context)` where `context` is the service's object on which
   you can make calls.
 * `services()` - Returns a list of services available.
 * `introspect(service, callback)` - Introspects on the methods available
   for a given `service`. `callback` is called when introspection is complete,
   and must be of the form `function(error, res)` where `res` is the result.