function testAuth() {
    asyncTest("Bad authorization", 3, function() {
        invoke("notAuthorized", [], function(error, res, more) {
            equal(error.name, "NotPermitted");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    //TODO: test the auth API
}