define(['stack.io-http'], function() {
    //Gets the default host
    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    //Creates a new http-based engine. This is a lighter-weight version of the
    //client that does not require socket.io and has less back-and-forth
    //communication with the server. In exchange, a subset of the
    //functionality is available. Where the equivalent functionality is
    //available, this client is designed to be API-compatible. Requires jquery
    //or zepto.
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
        callback(undefined, this);
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

        $.ajax({
            type: "POST",
            url: this.host + "stackio/invoke/" + encodeURI(service) + "/" + encodeURI(method),
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(args),

            complete: function(xhr, status) {
                var response = JSON.parse(xhr.responseText);

                for(var i=0; i<response.length; i++) {
                    callback(response[i].error, response[i].result, i == response.length - 1);
                }
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
        this.invoke.apply(this, args);
    };

    //Logs a user out
    //args... : array
    //      The method arguments
    //callback : function(error : object, result : anything, more : boolean)
    //      The function to call when a result is received
    Engine.prototype.logout = function(/*args..., callback*/) {
        var args = ["_stackio", "logout"].concat(Array.prototype.slice.call(arguments));
        this.invoke.apply(this, args);
    };

    //Performs introspection
    //service : string
    //      The service name
    //callback : function(error : object, result : object)
    //      The function to call when the service is ready to be used; result
    //      contains the introspection data
    Engine.prototype.introspect = function(service, callback) {
        this.invoke("_stackio", "inspect", service, callback);
    };

    return { io: Engine };
});
