function testAuth() {
    module("Authentication");

    asyncTest("Bad authorization", 3, function() {
        testService.notAuthorized(function(error, res, more) {
            equal(error.name, "NotPermittedError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Good API-based authentication", 3, function() {
        authService.check_auth("test", "test-password", function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad API-based authentication", 3, function() {
        authService.check_auth("test", "bad", function(error, res, more) {
            equal(error, null);
            equal(res, false);
            equal(more, false);
            start();
        });
    });

    asyncTest("Has user", 3, function() {
        authService.has_user("test", function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            start();
        });
    });

    asyncTest("Has group", 3, function() {
        authService.has_group("test", function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            start();
        });
    });

    asyncTest("Get all groups", 3, function() {
        authService.get_all_groups(function(error, res, more) {
            equal(error, null);
            ok(setsEquivalent(res, [{name: "test"}, {name: "demo"}]));
            equal(more, false);
            start();
        });
    });

    asyncTest("Get non-existent group permissions and membership", 6, function() {
         var barrier = createBarrier(2, start);

        authService.get_group_permissions("fooo", function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            barrier();
        });

        authService.get_user_groups_by_group("fooo", function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            barrier();
        });
    });

    asyncTest("Get group permissions and membership", 6, function() {
        var barrier = createBarrier(2, start);

        authService.get_group_permissions("test", function(error, res, more) {
            equal(error, null);
            equal(res.length, 10);
            equal(more, false);
            barrier();
        });

        authService.get_user_groups_by_group("test", function(error, res, more) {
            equal(error, null);
            ok(setsEquivalent(res, [{username: "test"}]));
            equal(more, false);
            barrier();
        });
    });

    asyncTest("Get user groups", 3, function() {
        authService.get_user_groups_by_user("test", function(error, res, more) {
            equal(error, null);
            ok(setsEquivalent(res, [{name: "test"}]));
            equal(more, false);
            start();
        });
    });

    asyncTest("Get non-existent user groups", 3, function() {
        authService.get_user_groups_by_user("fooo", function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            start();
        });
    });
}
