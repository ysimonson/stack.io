__socket_source__

(function() {
    //Gets the default host
    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    //Creates a new stack.io engine
    function Engine() {
        var self = this;

        //Get the input configuration
        self.host = arguments.length > 1 ? arguments[0] : defaultHost();
        self.token = arguments.length > 2 ? arguments[1] : null;

        var callback = arguments.length > 0 ? arguments[arguments.length - 1] : function(error) {
            if(error) console.error(error);
        };

        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = window.location.protocol + "//" + self.host;
        }

        self.userId = null;
        self.permissions = [];
        self._channelCounter = 0;
        self._channels = {};

        self._socket = io.connect(self.host);

        //If an error occurs and there is no callback, this event will be fired
        self._socket.on("error", function(error, userId, permissions) {
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
        self._socket.emit("init", self.token, function(error, userId, permissions, services) {
            self.userId = userId;
            self.permissions = permissions;
            self.services = services;
            callback(error);
        });
    }

    //Invokes a method
    //service : string
    //      The service name
    //method : string
    //      The method name
    //args : array
    //      The method arguments
    //options : object
    //      ZeroRPC arguments. Legal members:
    //      * hearbeat : number - sets the heartbeat, in seconds (default 10)
    //      * timeout : number - Sets the timeout, in seconds (default 30)
    //callback : function(error : object, result : anything, more : boolean)
    //      The function to call when a result is received
    Engine.prototype.invoke = function(service, method, args, options, callback) {
        if(callback === undefined) {
            callback = options;
            options = {};
        }

        var channel = this._channelCounter++;
        this._channels[channel] = callback;
        this._socket.emit("invoke", channel, service, method, args, options);
    };

    this.stack = { io: Engine };
})(this);