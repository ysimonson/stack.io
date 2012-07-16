define(['socket.io'], function() {
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
    //      * timeout (number) - specifies the timeout in seconds
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
        
        self.options = options || {};
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
                if(error) return callback(error);

                for(var i=0; i<result.length; i++) {
                    self._services[result[i]] = {
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

    //Performs introspection
    //service : string
    //      The service name
    //callback : function(error : object, result : object)
    //      The function to call when the service is ready to be used; result
    //      contains the introspection data
    Engine.prototype._introspect = function(service, callback) {
        this._invoke("_stackio", "inspect", service, callback);
    }

    //--BEGIN SHARED CODE--
    //--END SHARED CODE--

    return { io: Engine };
});
