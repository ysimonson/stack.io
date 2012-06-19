function testValidation() {
    module("Validation");

    asyncTest("Bad service - non-string", 3, function() {
        client.invoke({}, "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad service - empty string", 3, function() {
        client.invoke("", "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad service - invalid identifier", 3, function() {
        client.invoke("0service", "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - non-string", 3, function() {
        client.invoke({}, "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - non-string", 3, function() {
        client.invoke("bad_test", {}, function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - empty string", 3, function() {
        client.invoke("bad_test", "", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - invalid identifier", 3, function() {
        client.invoke("bad_test", "0method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    test("Not enough arguments", 1, function() {
        raises(function() {
            client.invoke("bad_test", "method");
        });
    });
}