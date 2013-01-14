var validation = require("../validation"),
    model = require("../model"),
    util = require("util"),
    events = require("events"),
    dgram = require("dgram");

var MAX_SESSION_SLEEP_TIME = 2 * 60 * 1000;

//Creates a new UDP connector
function UdpConnector(port, debug) {
    this.port = port;
    this.debug = debug;
    this._sessionIdCounter = 0;
}

util.inherits(UdpConnector, events.EventEmitter);

//The connector name
UdpConnector.prototype.name = "http";

//Starts the http connector
UdpConnector.prototype.listen = function() {
    var self = thos;
    var socket = dgram.createSocket("udp4");

    socket.on("message", function(buffer) {
        try {
            var json = JSON.parse(buffer.toString());
        } catch(e) {
            if(debug) {
                console.error("Received bad message on UDP connector:", e);
            }
            
            return;
        }

        self._doInvoke(json);
    });

    socket.bind(self.port);
}

//Invokes a method
//json : object
//      The JSON body of the request
UdpConnector.prototype._doInvoke = function(json) {
    var serviceName = json.service;
    var methodName = json.method;
    var args = json.args;

    try {
        validation.validateInvocation(serviceName, methodName, args);
    } catch(e) {
        if(debug) {
            console.error("Invalid invocation request on UDP connector:", e);
        }
    }

    var sessionId = this._sessionIdCounter++;

    var session = new model.Session({
        id: "udp:" + sessionId,
        zerorpcOptions: {}
    });

    var stackRequest = new model.Request(serviceName, methodName, args, session);
    var stackResponse = new model.Response();

    if(debug) {
        var headerMessage = serviceName + "." + methodName + "(" + args.join(", ") + "):";

        stackResponse.on("update", function(error, result, more) {
            console.log(headerMessage, error, result, more);
        });
    }

    this.emit("invoke", stackRequest, stackResponse);
}

module.exports = UdpConnector;
