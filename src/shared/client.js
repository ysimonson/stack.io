//Gets a list of services that are available
//return : array of string
//      A list of available services
Engine.prototype.services = function() {
    var services = [];
    for(var service in this._services) services.push(service);
    return services;
};

//Introspects on a service
//service : string
//      The service name
//callback : function(error : object, result : object)
//      The function to call when the service is ready to be used; result
//      contains the introspection data
Engine.prototype.introspect = function(service, callback) {
    var self = this;
    var cached = self._services[service];

    //Try to fetch the cached result if possible
    if(!cached) {
        throw new Error("Unknown service");
    } else if(cached.introspected) {
        callback(null, cached.introspected);
    } else {
        //Otherwise perform the actual introspection
        this._introspect(service, function(error, result) {
            if(result) self._services[service].introspected = result;
            callback(error, result);
        });
    }
};

//Provides an interface for a service
//service : string
//      The service name
//callback : function(error : object, context : object)
//      The function to call when the service is ready to be used; context
//      contains the callable methods
Engine.prototype.use = function(service, callback) {
    var self = this;
    var cached = self._services[service];

    //Try to fetch the cached result if possible
    if(!cached) {
        throw new Error("Unknown service");
    } else if(cached.context) {
        callback(null, cached.context);
    } else {
        //Otherwise introspect on the service
        self.introspect(service, function(error, result) {
            if(error) return callback(error);
            var context = {};

            //Create the stub context
            for(var method in result.methods) {
                context[method] = createStubMethod(self, service, method);
            }

            //Cache the results
            cached.context = context;

            callback(error, context);
        });
    }
};

// Currified version of _invoke (stack.io v0.1 compatibility)
// service: string
//      The service name
// method: string
//      The method name
Engine.prototype.call = function(service, method) {
    return createStubMethod(this, service, method);
}

//Creates a stub method for a context that actually invokes the remote process
//engine : object
//      The stack.io engine
//service : string
//      The service name
//method : string
//      The method name
//returns : function
//      The stub method
function createStubMethod(engine, service, method) {
    return function() {
        var args = [service, method].concat(Array.prototype.slice.call(arguments));
        engine._invoke.apply(engine, args);
    };
}
