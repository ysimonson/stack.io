define(['socket.io'], function() {
    //Gets the default host
    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    //Creates a new stack.io engine
    function Engine(host, options, callback) {
        if (!(this instanceof Engine)) {
            return new Engine(host, options, callback);
        }

        var self = this;

        if(arguments.length === 1) {
            options = {};

            callback = function(error) {
                if(error) console.error(error);
            };
        } else if(arguments.length === 2) {
            callback = options;
            options = {};
        }

        self.host = host || defaultHost();
        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = window.location.protocol + "//" + self.host;
        }

        
        self.options = options;
        self._services = {};
        self._channelCounter = 0;
        self._channels = {};
        self._socket = io.connect(self.host);

        //If an error occurs and there is no callback, this event will be fired
        self._socket.on("error", function(error) {
            console.error(error);
        });

        //Federates out response events to the appropriate callback
        self._socket.on("response", function(channel, error, result, more) {
            var callback = self._channels[channel];

            if(callback === undefined) {
                console.error("Response receive on closed or non-existent channel " + channel);
            } else {
                callback(error, result, more);
                if(!more) delete self._channels[channel];
            }
        });

        //Initialize the socket
        self._socket.emit("init", self.options, function(error) {
            if(error) return callback(error);

            self._invoke("_stackio", "services", function(error, result, more) {
                for(var i=0; i<result.length; i++) {
                    self._services[result[i]] = {
                        ready: false,
                        context: null,
                        introspected: null
                    };
                }

                callback(error, self);
            });
        });
    }

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

        var args = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
        var callback = arguments[arguments.length - 1];

        var channel = this._channelCounter++;
        this._channels[channel] = callback;
        this._socket.emit("invoke", channel, service, method, args);
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
        } else if(cached.ready) {
            callback(null, cached.introspected);
        } else {
            //Otherwise get the service, which will also fetch the
            //introspection data
            self.use(service, function(error) {
                if(error) return callback(error);
                callback(null, self._services[service].introspected);
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
        } else if(cached.ready) {
            callback(null, cached.context);
        } else {
            //Otherwise introspect on the service
            this._invoke("_stackio", "inspect", service, function(error, result, more) {
                if(error) return callback(error);
                var context = {};

                //Create the stub context
                for(var method in result.methods) {
                    context[method] = createStubMethod(self, service, method);
                }

                //Cache the results
                self.services[service] = {
                    ready: true,
                    context: context,
                    introspected: result
                };
                
                callback(error, context);
            });
        }
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

    return { IO: Engine, io: Engine };
});
