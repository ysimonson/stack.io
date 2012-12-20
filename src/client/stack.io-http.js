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

define(function() {
    //Gets the default host
    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    //Creates a new stack.io engine
    //options : object
    //      The ZeroRPC options
    //      Allowable options:
    //      * host (string) - specifies the host
    //callback : function(error, client)
    //      The function to call when initialization is complete. It is passed
    //      a potential error message, or the initialized client object
    function Engine(options, callback) {
        if (!(this instanceof Engine)) {
            return new Engine(options, callback);
        }

        var self = this;

        self.host = options.host || defaultHost();
        
        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = window.location.protocol + "//" + self.host;
        }

        if(self.host.charAt(self.host.length - 1) != "/") {
            self.host = self.host + "/";
        }
        
        self.options = options || {};
        self._services = {};
        self._sessionId = null;

        self._invoke("_stackio", "services", function(error, result, more) {
            if(error) return callback(error);

            for(var i=0; i<result.length; i++) {
                self._services[result[i]] = {
                    context: null,
                    introspected: null
                };
            }

            callback(error, self);
        });

        setInterval(function() {
            if(self._sessionId) {
                self._ajaxCall("stackio/ping?session=" + encodeURI(self._sessionId));
            }
        }, 60000);
    }

    //Used to make the underlying AJAX call
    //endpoint : string
    //      The relative URL endpoint to call
    //data : optional object
    //      The JSON-able object to pass to the server
    //callback : optional function
    //      The function to call on complete
    Engine.prototype._ajaxCall = function(endpoint, data, callback) {
        var options = {
            type: "POST",
            url: this.host + endpoint,
            dataType: "json"
        };

        if(data) {
            options.contentType = "application/json";
            options.data = JSON.stringify(data);
        }

        if(callback) {
            options.complete = callback;
        }

        $.ajax(options);
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
    Engine.prototype._invoke = function(service, method /*, args..., callback*/) {
        if(arguments.length < 3) throw new Error("No callback specified");

        var self = this;
        var args = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
        var callback = arguments[arguments.length - 1];
        var endpoint = "stackio/invoke/" + encodeURI(service) + "/" + encodeURI(method);

        if(self._sessionId) {
            endpoint += "?session=" + encodeURI(self._sessionId);
        }

        self._ajaxCall(endpoint, args, function(xhr, status) {
            try {
                var json = JSON.parse(xhr.responseText);
                var response = json.response;
                if(response == undefined) throw new Error();
            } catch(e) {
                var error = {
                    name: "RequestError",
                    message: "Could not parse response message",
                    traceback: null
                };

                callback(error, null, false);
                return;
            }

            if(json.session) {
                self._sessionId = json.session;
            }

            for(var i=0; i<response.length; i++) {
                callback(response[i].error, response[i].result, i < response.length - 1);
            }
        });
    };

    //Logs a user in
    //args... : array
    //      The method arguments
    //callback : function(error : object, result : anything, more : boolean)
    //      The function to call when a result is received
    Engine.prototype.login = function(/*args..., callback*/) {
        var args = ["_stackio", "login"].concat(Array.prototype.slice.call(arguments));
        this._invoke.apply(this, args);
    };

    //Logs a user out
    //args... : array
    //      The method arguments
    //callback : function(error : object, result : anything, more : boolean)
    //      The function to call when a result is received
    Engine.prototype.logout = function(/*args..., callback*/) {
        var args = ["_stackio", "logout"].concat(Array.prototype.slice.call(arguments));
        this._invoke.apply(this, args);
    };

    //Performs introspection
    //service : string
    //      The service name
    //callback : function(error : object, result : object)
    //      The function to call when the service is ready to be used; result
    //      contains the introspection data
    Engine.prototype._introspect = function(service, callback) {
        this._invoke("_stackio", "inspect", service, callback);
    };

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
    };

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

    return { io: Engine };
});
