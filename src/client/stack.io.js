__socket_source__

(function() {
    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    function Engine() {
        var self = this;

        self.host = arguments.length > 1 ? arguments[0] : defaultHost();
        self.token = arguments.length > 2 ? arguments[1] : null;
        self.userId = null;
        self.permissions = [];
        self._channelCounter = 0;
        self._channels = {};

        var callback = arguments.length > 0 ? arguments[arguments.length - 1] : function(error) {
            if(error) console.error(error);
        };

        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = window.location.protocol + "//" + self.host;
        }

        self._socket = io.connect(self.host);

        self._socket.on("error", function(error, userId, permissions) {
            console.error(error);
        });

        self._socket.on("response", function(channel, error, result, more) {
            var callback = self._channels[channel];

            if(callback === undefined) {
                console.error("Response receive on closed or non-existent channel " + channel);
            } else {
                callback(error, result, more);
                if(!more) delete self._channels[channel];
            }
        });

        self._socket.emit("init", self.token, function(error, userId, permissions) {
            self.userId = userId;
            self.permissions = permissions;
            callback(error);
        });
    }

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