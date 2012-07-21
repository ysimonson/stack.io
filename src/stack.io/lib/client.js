// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var zerorpc = require("zerorpc"),
    util = require("util"),
    events = require("events");

var REGISTRAR_ENDPOINT = "tcp://127.0.0.1:27615";

//Creates a new stack.io engine
//options : object
//      The ZeroRPC options
//      Allowable options:
//      * registrar (string) - specifies the registrar endpoint
//        (default 'tcp://127.0.0.1:27615')
//      * timeout (number) - specifies the timeout in seconds (default 30)
//callback : function
//      The function to call when the engine is initialized
function Engine(options, callback) {
    if (!(this instanceof Engine)) {
        return new Engine(options, callback);
    }

    var self = this;
    self.options = options || {};
    self._services = {};

    this._updateSvcList(callback);
}

util.inherits(Engine, events.EventEmitter);

// Update the list of registered services
// callback : function
//      The function to call once the list is updated.
Engine.prototype._updateSvcList = function(callback) {
    console.log('Updating service list');
    var self = this,
        registrarClient = self._createClient(self.options.registrar || REGISTRAR_ENDPOINT);

    registrarClient.invoke("services", true, function(error, res, more) {
        if(error) {
            self.emit("error", error);
        } else {
            for(var serviceName in res) {
                self._services[serviceName] = {
                    endpoint: res[serviceName],
                    client: null,
                    context: null,
                    introspected: null
                };
            }

            registrarClient.close();
            callback(error, self);
        }
    });
}

//Creates a new client
//endpoint : string
//      The ZeroMQ endpoint
//returns : object
//      A ZeroRPC client
Engine.prototype._createClient = function(endpoint) {
    var self = this;

    var client = new zerorpc.Client(self.options);
    client.connect(endpoint);

    //Proxy error messages
    client.on("error", function(error) {
        self.emit("error", error);
    });

    return client;
};

//Invokes a method
//service : string
//      The service name
//method : string
//      The method name
//args... : array
//      The method arguments
//callback : function(error : object, result : anything, more : boolean)
//      The function to call when a result is received
Engine.prototype._invoke = function(service/*, method, args..., callback*/) {
    if(arguments.length < 3) throw new Error("No callback specified");

    var args = Array.prototype.slice.call(arguments, 1);
    var cached = this._services[service];

    if(!cached) {
        throw new Error('Unknown service "' + service + '"');
    } else if(!cached.client) {
        cached.client = this._createClient(cached.endpoint);
    }

    cached.client.invoke.apply(cached.client, args);
};

//Exposes a service
//serviceName : string
//      The name of the service
//endpoint : string
//      The ZeroMQ endpoint of the service
//context : object
//      The methods to expose
Engine.prototype.expose = function(serviceName, endpoint, context) {
    var self = this;

    var server = new zerorpc.Server(context);
    server.bind(endpoint);

    server.on("error", function(error) {
        self.emit("error", error);
    });

    self.use("registrar", function(error, registrar) {
        if(error) {
            self.emit("error", error);
        } else {
            registrar.register(serviceName, endpoint, function(error) {
                if(error) {
                    self.emit("error", error);
                }
            });
        }
    });
};

//Performs introspection
//service : string
//      The service name
//callback : function(error : object, result : object)
//      The function to call when the service is ready to be used; result
//      contains the introspection data
Engine.prototype._introspect = function(service, callback) {
    this._invoke(service, "_zerorpc_inspect", callback);
}

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

exports.ioClient = Engine;
