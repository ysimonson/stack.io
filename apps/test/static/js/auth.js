function testAuth() {
    module("Authentication");

    asyncTest("Bad authorization", 3, function() {
        invoke("notAuthorized", [], function(error, res, more) {
            equal(error.name, "NotPermitted");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Get all groups", 3, function() {
        ainvoke("get_all_groups", [], function(error, res, more) {
            equal(error, null);
            ok(setsEquivalent(res, [{name: "test"}, {name: "demo"}]));
            equal(more, false);
            start();
        });
    });

    asyncTest("Get groups", 9, function() {
        ainvoke("get_group_by_name", ["test"], function(error, res, more) {
            equal(error, null);
            equal(res.name, "test");
            equal(more, false);

            var barrier = createBarrier(2, start);
            var groupId = res.id;

            ainvoke("get_group_by_id", [groupId], function(error, res, more) {
                equal(error, null);
                equal(res.name, "test");
                equal(more, false);
                barrier();
            });

            ainvoke("get_group_permissions", [groupId], function(error, res, more) {
                equal(error, null);
                equal(res.length, 9);
                equal(more, false);
                barrier();
            });
        });
    });

    asyncTest("Get user and groups", 9, function() {
        ainvoke("get_user_by_token", ["test:test-password"], function(error, res, more) {
            equal(error, null);
            equal(typeof(res.id), 'number');
            equal(more, false);

            var barrier = createBarrier(2, start);
            var userId = res.id;

            ainvoke("get_user_by_id", [userId], function(error, res, more) {
                equal(error, null);
                equal(res.id, userId);
                equal(more, false);
                barrier();
            });

            ainvoke("get_user_groups", [userId], function(error, res, more) {
                equal(error, null);
                ok(setsEquivalent(res, [{name: "test"}]));
                equal(more, false);
                barrier();
            });
        });
    });

    asyncTest("Create a new group", 9, function() {
        ainvoke("add_group", ["temp"], function(error, res, more) {
            equal(error, null);
            equal(typeof(res), 'number');
            equal(more, false);

            var groupId = res;

            ainvoke("add_group_permissions", [groupId, ["_stackio_auth.*"]], function(error, res, more) {
                equal(error, null);
                equal(res, null);
                equal(more, false);

                ainvoke("remove_group", [groupId], function(error, res, more) {
                    equal(error, null);
                    equal(res, null);
                    equal(more, false);
                    start();
                });
            });
        });
    });
}

function testAuthWithNewGroupPermissions(groupId) {
    //
}