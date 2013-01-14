var validation = require("../validation"),
    model = require("../model"),
    util = require("util"),
    events = require("events"),
    _ = require("underscore"),
    crypto = require("crypto"),
    express = require("express");

var MAX_SESSION_SLEEP_TIME = 2 * 60 * 1000;

//Creates a new HTTP connector
//expressApp : object
//      The express application to attach to
function HttpConnector(expressApp) {
    this.expressApp = expressApp;
    this._sessions = {};
}

util.inherits(HttpConnector, events.EventEmitter);

//The connector name
HttpConnector.prototype.name = "http";

//Starts the http connector
HttpConnector.prototype.listen = function() {
    //Allow CORS
    this.expressApp.all("/stackio/*", function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.header("Access-Control-Allow-Credentials", "true");
        next();
    });

    this.expressApp.post("/stackio/invoke/:serviceName/:methodName", _.bind(this._doInvoke, this));
    this.expressApp.post("/stackio/ping", _.bind(this._doPing, this));

    this.expressApp.options("/stackio/*", function(req, res, next) {
        res.send(200);
    });

    this.expressApp.all("/stackio/*", function(req, res, next) {
        res.jsonp(404, {});
    });
}

//Invokes a method
//req : object
//      The express request object
//res : object
//      The express response object
HttpConnector.prototype._doInvoke = function(req, res) {
    var self = this;
    var serviceName = req.params.serviceName;
    var methodName = req.params.methodName;
    var args = req.body;

    try {
        validation.validateInvocation(serviceName, methodName, args);
    } catch(e) {
        var errorObj = model.createSyntheticError("RequestError", e.message);
        return res.jsonp(400, {
            response: [{ error: errorObj }]
        });
    }

    var session = null;
    var sessionId = req.query.session;

    //Called once we have asession object to work with
    var sessionReady = function() {
        var stackRequest = new model.Request(serviceName, methodName, args, session);
        var stackResponse = new model.Response();
        var bufferedResponse = [];
        var hasError = false;

        stackResponse.on("update", function(error, result, more) {
            if(error) {
                bufferedResponse.push({"error": error});
                hasError = true;
            } else {
                bufferedResponse.push({"result": result});
            }

            if(!more) {
                res.jsonp(hasError ? 500 : 200, {
                    session: sessionId,
                    response: bufferedResponse
                });
            }
        });

        self.emit("invoke", stackRequest, stackResponse);
    };

    if(sessionId) {
        var sessionContainer = self._sessions[sessionId];
        if(sessionContainer) session = sessionContainer.obj;
    }

    if(session) {
        self._resetSessionTimer(sessionId);
        sessionReady();
    } else {
        //Generate a new session if one does not already exist
        crypto.randomBytes(20, function(ex, buffer) {
            sessionId = buffer.toString("hex");
            
            session = new model.Session({
                id: "http:" + sessionId,
                zerorpcOptions: {}
            })

            self._sessions[sessionId] = { obj: session };
            self._resetSessionTimer(sessionId);
            sessionReady();
        });
    }
}

//Handles a ping message from the client
//req : object
//      The express request object
//res : object
//      The express response object
HttpConnector.prototype._doPing = function(req, res) {
    var sessionId = req.query.session;

    if(sessionId && sessionId in this._sessions) {
        this._resetSessionTimer(sessionId);
        res.jsonp(200, {});
    } else {
        res.jsonp(400, {});
    }
}

//Resets the timer associated with a session
HttpConnector.prototype._resetSessionTimer = function(sessionId) {
    var self = this;
    var container = self._sessions[sessionId];
    clearInterval(container);

    container.timer = setTimeout(function() {
        if(sessionId in self._sessions) {
            self._sessions[sessionId].obj.finish();
            delete self._sessions[sessionId];
        }
    }, MAX_SESSION_SLEEP_TIME);
};

module.exports = HttpConnector;
