exports.seed = function(auth, config) {
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