var mysql = require("mysql"),
    base = require("./auth-base"),
    util = require("util"),
    crypto = require("crypto"),
    _ = require("underscore");

var GET_PERMISSIONS_QUERY = "SELECT permissions.pattern AS pattern FROM permissions, user_groups WHERE permissions.group_id=user_groups.group_id AND user_groups.user_id=?";
var GET_USER_ID_QUERY = "SELECT id FROM users WHERE username=? AND password_hash=? LIMIT 1";

function Authorizer(config) {
    base.Authorizer.call(this, config);
    this._client = mysql.createClient(config);
}

util.inherits(Authorizer, base.Authorizer);

Authorizer.prototype.authenticate = function(username, password, callback) {
    var self = this;

    //Gets the hash of the password
    var sha = crypto.createHash('sha256');
    sha.update(password);
    var hash = sha.digest('base64');

    //Updates the user's permissions
    var updatePermissions = function(user, callback) {
        self._client.query(GET_PERMISSIONS_QUERY, [user.id], function(error, results) {
            if(error) {
                return callback(error);
            }

            var permissions = _.pluck(results, 'pattern');
            user.updatePermissions(permissions);
            callback(null);
        });
    };

    //Get the initial permissions
    var initialUpdatePermissions = function(user) {
        updatePermissions(user, function(error) {
            if(error) {
                return callback(error, self.unauthenticated());
            }

            //Update the user's permissions every few seconds
            setInterval(function() {
                updatePermissions(user, function(error) {
                    if(error) {
                        self.emit("error", error);
                    }
                });
            }, self.config.permissionsSleepTime);

            callback(null, user);
        });
    }

    //Look up the user in the mysql database
    self._client.query(GET_USER_ID_QUERY, [username, hash], function(error, results) {
        if(error) {
            self.emit("error", error);
            callback("Could not fetch user data", self.unauthenticated());
        } else if(!results || results.length == 0) {
            callback("Authentication failed", self.unauthenticated());
        } else {
            var user = new base.User(results[0].id, []);
            initialUpdatePermissions(user);
        }
    });
};

exports.Authorizer = Authorizer;