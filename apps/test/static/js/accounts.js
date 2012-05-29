function testAccounts() {
    module("Account Manipulation");

    function setupAccounts(userToken, groupName, callback) {
        ainvoke("add_group", [groupName], function(error, res, more) {
            equal(error, null);
            equal(typeof(res), 'number');
            equal(more, false);

            var groupId = res;

            ainvoke("add_user", [userToken], function(error, res, more) {
                equal(error, null);
                equal(typeof(res), 'number');
                equal(more, false);

                callback(res, groupId);
            });
        });
    }

    function teardownAccounts(userId, groupId) {
        var barrier = createBarrier(2, start);

        ainvoke("remove_user", [userId], function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            barrier();
        });

        ainvoke("remove_group", [groupId], function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            barrier();
        }); 
    }

    asyncTest("Manipulating group permissions", 21, function() {
        setupAccounts("test0:pwd", "test0-group", function(userId, groupId) {
            ainvoke("add_group_permissions", [groupId, ["_stackio_auth.*", "temp.*"]], function(error, res, more) {
                equal(error, null);
                equal(res, null);
                equal(more, false);

                ainvoke("remove_group_permissions", [groupId, ["temp.*"]], function(error, res, more) {
                    equal(error, null);
                    equal(res, null);
                    equal(more, false);

                    ainvoke("clear_group_permissions", [groupId], function(error, res, more) {
                        equal(error, null);
                        equal(res, null);
                        equal(more, false);
                        teardownAccounts(userId, groupId);
                    });
                });
            }); 
        });
    });

    asyncTest("Adding/removing user groups by user ID", 24, function() {
        setupAccounts("test1:pwd", "test1-group", function(userId, groupId) {
            ainvoke("add_user_groups_by_user", [userId, [groupId]], function(error, res, more) {
                equal(error, null);
                equal(res, null);
                equal(more, false);

                ainvoke("get_user_groups_by_user", [userId], function(error, res, more) {
                    equal(error, null);
                    ok(setsEquivalent(res, [{id: groupId}]));
                    equal(more, false);

                    ainvoke("remove_user_groups_by_user", [userId, [groupId]], function(error, res, more) {
                        equal(error, null);
                        equal(res, null);
                        equal(more, false);

                        ainvoke("get_user_groups_by_user", [userId], function(error, res, more) {
                            equal(error, null);
                            ok(setsEquivalent(res, []));
                            equal(more, false);
                            teardownAccounts(userId, groupId);
                        });
                    });
                });
            });
        });
    });

    asyncTest("Adding/removing user groups by group ID", 24, function() {
        setupAccounts("test2:pwd", "test2-group", function(userId, groupId) {
            ainvoke("add_user_groups_by_group", [groupId, [userId]], function(error, res, more) {
                equal(error, null);
                equal(res, null);
                equal(more, false);

                ainvoke("get_user_groups_by_group", [groupId], function(error, res, more) {
                    equal(error, null);
                    ok(setsEquivalent(res, [{id: userId}]));
                    equal(more, false);

                    ainvoke("remove_user_groups_by_group", [groupId, [userId]], function(error, res, more) {
                        equal(error, null);
                        equal(res, null);
                        equal(more, false);

                        ainvoke("get_user_groups_by_group", [groupId], function(error, res, more) {
                            equal(error, null);
                            ok(setsEquivalent(res, []));
                            equal(more, false);
                            teardownAccounts(userId, groupId);
                        });
                    });
                });
            });
        });
    });
}