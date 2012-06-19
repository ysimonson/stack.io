__socket_source__

(function() {
    //Gets the default host
    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    //Creates a new stack.io engine
    function Engine(options) {
        var self = this;

        //Get the input configuration
        self.host = options.host || defaultHost();
        self.username = options.username || "root";
        self.password = options.password || "";

        var zeroRpcOptions = {};
        if(options.timeout) zeroRpcOptions.timeout = options.timeout;

        callback = options.callback || function(error) {
            if(error) console.error(error);
        };

        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = window.location.protocol + "//" + self.host;
        }

        self.permissions = [];
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
        self._socket.emit("init", self.username, self.password, zeroRpcOptions, function(error, permissions, services) {
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
    //args... : array
    //      The method arguments
    //callback : function(error : object, result : anything, more : boolean)
    //      The function to call when a result is received
    Engine.prototype.invoke = function(service, method /*, args..., callback*/) {
        if(arguments.length < 3) throw new Error("No callback specified");

        var args = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
        var callback = arguments[arguments.length - 1];

        var channel = this._channelCounter++;
        this._channels[channel] = callback;
        this._socket.emit("invoke", channel, service, method, args);
    };

    this.stack = { IO: Engine };
})(this);