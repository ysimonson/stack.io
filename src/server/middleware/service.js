var BaseMiddleware = require("./base"),
    util = require("util");

function ServiceMiddleware() {

}

util.inherits(ServiceMiddleware, BaseMiddleware);
module.exports = ServiceMiddleware;