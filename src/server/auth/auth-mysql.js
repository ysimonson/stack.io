//TODO: remove console.errors

var mysql = require("mysql"),
    base = require("./auth-base"),
    util = require("util"),
    crypto = require("crypto"),
    str = require("../str"),
    _ = require("underscore");

var GET_PRIVILEGES_QUERY = "SELECT privileges.pattern AS pattern FROM privileges, user_groups WHERE privileges.group_id=user_groups.group_id AND user_groups.user_id=?";
var GET_USER_ID_QUERY = "SELECT id FROM users WHERE token_hash=? LIMIT 1";

function Authorizer(config) {
    base.Authorizer.call(this, config);
    this._client = mysql.createClient(config);
}

util.inherits(Authorizer, base.Authorizer);

Authorizer.prototype.authenticate = function(token, callback) {
    var self = this;

    var sha = crypto.createHash('sha256');
    sha.update(token);
    var hash = sha.digest('base64');

    var updatePermissions = function(user, callback) {
        self._client.query(GET_PRIVILEGES_QUERY, [user.id], function(error, results) {
            if(error) {
                return callback(error);
            }

            var permissions = _.pluck(results, 'pattern');
            user.updatePermissions(permissions);
            callback(null);
        });
    };

    var initialUpdatePermissions = function(user) {
        updatePermissions(user, function(error) {
            if(error) {
                return callback(error, self.unauthenticated());
            }

            setInterval(function() {
                updatePermissions(user, function(error) {
                    console.error("Could not update user permissions:", error);
                });
            }, config.privilegesSleepTime);

            callback(null, user);
        });
    }

    self._client.query(GET_USER_ID_QUERY, [hash], function(error, results) {
        if(error) {
            console.error("Could not fetch user data:", error);
            callback("Could not fetch user data", self.unauthenticated());
        } else if(!results || results.length == 0) {
            callback("Authentication failed", self.unauthenticated());
        } else {
            var user = new base.User(reuslts[0].id, []);
            initialUpdatePermissions(user);
        }
    });
};

exports.Authorizer = Authorizer;