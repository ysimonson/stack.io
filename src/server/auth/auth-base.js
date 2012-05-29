var _ = require("underscore"),
    util = require("util"),
    events = require("events");

function quoteRegex(str) {
    return (str+'').replace(/([.?+^$[\]\\(){}|-])/g, "\\$1");
}

function Authorizer(config) {
    this.config = config;
}

util.inherits(Authorizer, events.EventEmitter);

Authorizer.prototype.authenticate = function(token, callback) {
    callback(null, new RootUser());
};

Authorizer.prototype.root = function() {
    return new RootUser();
};

Authorizer.prototype.unauthenticated = function() {
    return new StemUser();
};

function User(id, permissions) {
    this.id = id;
    this.updatePermissions(permissions);
}

User.prototype.updatePermissions = function(permissions) {
    this.permissions = permissions;

    this._compiledPermissions = _.map(permissions, function(permission) {
        var pattern = quoteRegex(permission).replace("*", ".+");
        return new RegExp("^" + pattern + "$");
    });
};

User.prototype.canInvoke = function(service, method) {
    var pattern = service + "." + method;

    return _.any(this._compiledPermissions, function(permission) {
        return permission.test(pattern);
    });
};

function RootUser() {
    User.call(this, -1, ["*"]);
}

util.inherits(RootUser, User);

function StemUser() {
    User.call(this, -2, []);
}

util.inherits(StemUser, User);

exports.Authorizer = Authorizer;
exports.User = User;
exports.RootUser = RootUser;
exports.StemUser = StemUser;