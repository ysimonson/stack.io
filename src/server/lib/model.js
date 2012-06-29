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

function Finishable() {
    this.finished = false;
}

util.inherits(Finishable, events.EventEmitter);

Finishable.prototype.finish = function() {
    if(this.finished) {
        throw new Error("Response already finished");
    } else {
        this.finished = true;
        this.emit("finish");
    }
};

function Session(initial) {
    for(var key in initial) {
        this[key] = initial[key];
    }
}

util.inherits(Session, Finishable);

function Request(service, method, args, session) {
    this.service = service;
    this.method = method;
    this.args = args;
    this.session = session;
}

function Response() {}
util.inherits(Response, Finishable);

Response.prototype.update = function(error, result, more) {
    this.emit("update", error, result, more);
    if(!more) this.finish();
};

exports.createSyntheticError = createSyntheticError;
exports.Session = Session;
exports.Request = Request;
exports.Response = Response;