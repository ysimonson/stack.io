var AUTH_ENDPOINT = "tcp://0.0.0.0:27616";

var api = require('./api'),
    nopt = require('nopt'),
    zerorpc = require('zerorpc'),
    fs = require('fs');

var options = nopt(
    { 'dbname': [String, null] },
    { '-n': '--dbname' },
    process.argv,
    2
);
options.dbname = options.dbname || 'stackio_auth';

function exit(msg) {
    console.error(msg);
    process.exit(-1);
}

function openJSON(path, cb) {
    fs.readFile(path, function(err, contents) {
        if (err) {
            return cb(err);
        }
        try {
            return cb(null, JSON.parse(contents));
        } catch (e) {
            cb(e);
        }
    });
}

function seed(auth, config) {
    function addPerms(name) {
        var perms = config.groups[name];
        for (var svc in perms) {
            var insertables = perms[svc].reduce(function(prev, item) {
                prev.push({
                    service: svc,
                    method: item
                });
                return prev;
            }, []);
            auth.addGroupPermissions(name, insertables, function(err) {
                if (err) throw err;
            })
        }
    }

    function addGroup(name) {
        auth.hasGroup(name, function(err, has) {
            if (err)
                throw err;
            if (has) {
                auth.clearGroupPermissions(name, function(err) {
                    if (err) throw err;
                    addPerms(name);
                });
            } else {
                auth.addGroup(name, function(err) { 
                    if (err) throw err;
                    addPerms(name);
                });
            }
        });
    }

    function addUser(username) {
        var data = config.users[username];
        auth.hasUser(username, function(err, has) {
            if (err) throw err;
            if (has) {
                auth.checkAuth(username, data.password, function(err, ok) {
                    if (err) throw err;
                    if (!ok) {
                        throw 'Could not authenticate user ' + username;
                    }
                    auth.clearUserGroups(username, function(err) {
                        if (err) throw err;
                        auth.addUserGroups(username, data.groups, 
                            function(err) { if (err) throw err; });
                    });
                });
            } else {
                auth.addUser(username, data.password, function(err) {
                    if (err) throw err;
                    auth.addUserGroups(username, data.groups, function(err) {
                        if (err) throw err;
                    });
                })
            }
        });
    }

    for (var name in config.groups) {
        addGroup(name);
    }

    for (var username in config.users) {
        addUser(username);
    }
}

function main() {
    var auth = api(options.dbname);
    if (options.argv.remain.length > 0) {
        openJSON(options.argv.remain[0], function(err, cfg) {
            seed(auth, cfg);
        });
    }
    var registrar = new zerorpc.Client();
    registrar.connect("tcp://127.0.0.1:27615");
    registrar.invoke("register", "auth", AUTH_ENDPOINT, function(err) {
        if (err)
            console.error(err);
        registrar.close();
    });

    var server = new zerorpc.Server(auth);
    server.bind(AUTH_ENDPOINT);
    server.on('error', function(err) {
        console.error('Server Error!', err);
    });
}

main();

/*

def seed(auth, config):
def main():
    options, args = parser.parse_args()

    conn = database.Connection(options.dbhost, options.dbname, user=options.dbuser, password=options.dbpass)
    auth = api.Authorizer(conn)

    if len(args) > 0:
        seed_config = get_json_content(args[0])
        seed(auth, seed_config)

    #Register the API
    registrar = zerorpc.Client()
    registrar.connect("tcp://127.0.0.1:27615")
    registrar.register("auth", AUTH_ENDPOINT)
    registrar.close()

    #Run the API
    server = zerorpc.Server(auth)
    server.bind(AUTH_ENDPOINT)
    server.run()

if __name__ == "__main__":
    main()
*/