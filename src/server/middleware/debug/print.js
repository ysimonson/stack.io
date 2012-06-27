var util = require("util"),
    MiddlewareBase = require("../base");

function listenObject(header, obj) {
    obj.on("update", function(keys) {
        console.log(header, keys, "=>", obj);
    });
}

function listen(header, request, response) {
    console.log(header);
    console.log("* REQUEST:", request);
    console.log("* RESPONSE:", response);
    listenObject(header + " :: UPDATE REQUEST:", request);
    listenObject(header + " :: UPDATE RESPONSE:", request);
}

function PrinterMiddleware(config) {
    MiddlewareBase.call(this, config);
}

util.inherits(PrinterMiddleware, MiddlewareBase);

PrinterMiddleware.prototype.invoke = function(request, response, next) {
    listen("INVOKE", request, response);
    next();
};

PrinterMiddleware.prototype.setupSession = function(request, response, next) {
    listen("SETUP SESSION", request, response);
    next();
};

PrinterMiddleware.prototype.teardownSession = function(request, response, next) {
    listen("TEARDOWN SESSION", request, response);
    next();
};

module.exports = PrinterMiddleware;