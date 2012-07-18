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
        authService.checkAuth("test", "test-password", function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad API-based authentication", 3, function() {
        authService.checkAuth("test", "bad", function(error, res, more) {
            equal(error, null);
            equal(res, false);
            equal(more, false);
            start();
        });
    });

    asyncTest("Has user", 3, function() {
        authService.hasUser("test", function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            start();
        });
    });

    asyncTest("Has group", 3, function() {
        authService.hasGroup("test", function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            start();
        });
    });

    asyncTest("Get all groups", 3, function() {
        authService.getAllGroups(function(error, res, more) {
            equal(error, null);
            deepEqual(res, [{id: 1, name: "test"}]);
            equal(more, false);
            start();
        });
    });

    asyncTest("Get non-existent group permissions and membership", 6, function() {
         var barrier = createBarrier(2, start);

        authService.getGroupPermissions("fooo", function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            barrier();
        });

        authService.getGroupMembers("fooo", function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            barrier();
        });
    });

    asyncTest("Get group permissions and membership", 6, function() {
        var barrier = createBarrier(2, start);

        authService.getGroupPermissions("test", function(error, res, more) {
            equal(error, null);
            equal(res.length, 10);
            equal(more, false);
            barrier();
        });

        authService.getGroupMembers("test", function(error, res, more) {
            equal(error, null);
            deepEqual(res, [{username: "test"}]);
            equal(more, false);
            barrier();
        });
    });

    asyncTest("Get user groups", 3, function() {
        authService.getUserGroups("test", function(error, res, more) {
            equal(error, null);
            deepEqual(res, [{name: "test"}]);
            equal(more, false);
            start();
        });
    });

    asyncTest("Get non-existent user groups", 3, function() {
        authService.getUserGroups("fooo", function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);
            start();
        });
    });
}
