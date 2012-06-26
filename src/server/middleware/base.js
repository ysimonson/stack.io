var events = require("events"),
    util = require("util");

function Middleware(config) {
    this.connector = new RegExp(config.connector);
    this.service = new RegExp(config.service);
    this.method = new RegExp(config.method);
    this.config = config;
}

util.inherits(Middleware, events.EventEmitter);
module.exports = Middleware;