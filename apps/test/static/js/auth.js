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

    asyncTest("Get groups and associated users", 13, function() {
        ainvoke("get_group_by_name", ["test"], function(error, res, more) {
            equal(error, null);
            equal(res.name, "test");
            equal(more, false);

            var barrier = createBarrier(3, start);
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

            ainvoke("get_user_groups_by_group", [groupId], function(error, res, more) {
                equal(error, null);
                equal(res.length, 1);
                equal(typeof(res[0].id), 'number');
                equal(more, false);
                barrier();
            });
        });
    });

    asyncTest("Get user and associated groups", 9, function() {
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

            ainvoke("get_user_groups_by_user", [userId], function(error, res, more) {
                equal(error, null);
                ok(setsEquivalent(res, [{name: "test"}]));
                equal(more, false);
                barrier();
            });
        });
    });
}
