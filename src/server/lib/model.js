var util = require("util"),
    events = require("events");

//Creates an object that mimicks the error objects received from remote ZeroRPC services
function createSyntheticError(name, message) {
    return {
        name: name,
        message: message,
        traceback: null
    };
}

//An object that can emit `finish` events
function Finishable() {
    this.finished = false;
}

util.inherits(Finishable, events.EventEmitter);

//Emits a `finish` event
Finishable.prototype.finish = function() {
    if(this.finished) {
        throw new Error("Response already finished");
    } else {
        this.finished = true;
        this.emit("finish");
    }
};

//A user session
//initial : object
//      Map of initial session values
function Session(initial) {
    for(var key in initial) {
        this[key] = initial[key];
    }
}

util.inherits(Session, Finishable);

//A user request
//service : string
//      The service name
//method : string
//      The method name
//args : array of anything
//      The invocation arguments
//session : object
//      The user session
function Request(service, method, args, session) {
    this.service = service;
    this.method = method;
    this.args = args;
    this.session = session;
}

//A user response
function Response() {}
util.inherits(Response, Finishable);

//Emits a response update
Response.prototype.update = function(error, result, more) {
    this.emit("update", error, result, more);
    if(!more) this.finish();
};

exports.createSyntheticError = createSyntheticError;
exports.Session = Session;
exports.Request = Request;
exports.Response = Response;