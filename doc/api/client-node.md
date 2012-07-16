# Node.js API #

To instantiate a new client:

    stack.io(function(error, client) {
        ...
    });

The argument is a callback when the initialization is complete, which will
include either a fatal `error` message, or the `client` object.

Methods:
 * `expose(serviceName, endpoint, context)` - Exposes a new stack.io service,
   where `serviceName` is the name of the service, `endpoint` is the ZeroMQ
   endpoint to expose to, and `context` is the object to expose.
 * `use(serviceName, callback)` - Prepares a service to be used. `serviceName`
   is the name of a service and `callback` is a function to call when the
   service is ready. `callback` should be of the form
   `function(error, context)` where `context` is the service's object on which
   you can make calls.
 * `services()` - Returns a list of services available.
 * `introspect(service, callback)` - Introspects on the methods available
   for a given `service`. `callback` is called when introspection is complete,
   and must be of the form `function(error, res)` where `res` is the result.