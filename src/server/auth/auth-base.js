var _ = require("underscore"),
    util = require("util"),
    events = require("events");

//Escapes a regex string
function quoteRegex(str) {
    return (str+'').replace(/([.?+^$[\]\\(){}|-])/g, "\\$1");
}

//Creates a new authorizor
//config : object
//      The authorizor-specific configuration
function Authorizer(config) {
    this.config = config;
}

util.inherits(Authorizer, events.EventEmitter);

//Performs authentication
//username : string
//      The authenticating username
//password : string
//      The authenticating password
//callback : function(error : string, user : object)
//      The function to call after authentication completes
Authorizer.prototype.authenticate = function(username, password, callback) {
    callback(null, new RootUser());
};

//Gets the root user
Authorizer.prototype.root = function() {
    return new RootUser();
};

//Gets an unauthenticated user
Authorizer.prototype.unauthenticated = function() {
    return new StemUser();
};

//Creates a new user
//id : number
//      The user ID
//permissions : array of strings
//      The permissions allowed for the user
function User(id, permissions) {
    this.id = id;
    this.updatePermissions(permissions);
}

User.prototype.toJSON = function() {
    return { type: "basic", id: this.id };
};

//Updates the user permissions
//permissions : array of strings
//      The permissions allowed for the user
User.prototype.updatePermissions = function(permissions) {
    this.permissions = permissions;

    this._compiledPermissions = _.map(permissions, function(permission) {
        var pattern = quoteRegex(permission).replace("*", ".+");
        return new RegExp("^" + pattern + "$");
    });
};

//Returns whether a method can be invoked by the user
//service : string
//      The service name
//method : string
//      The method name
//return : boolean
//      Whether the method can be invoked
User.prototype.canInvoke = function(service, method) {
    var pattern = service + "." + method;

    return _.any(this._compiledPermissions, function(permission) {
        return permission.test(pattern);
    });
};

//The root user, with universal access privileges
function RootUser() {
    User.call(this, -1, ["*"]);
}

util.inherits(RootUser, User);

//The stem user, with no access privileges
function StemUser() {
    User.call(this, -2, []);
}

util.inherits(StemUser, User);

exports.Authorizer = Authorizer;
exports.User = User;
exports.RootUser = RootUser;
exports.StemUser = StemUser;