function testIntegration() {
    asyncTest("Normal string method", 3, function() {
        invoke("addMan", ["This is not an error"], function(error, res, more) {
            equal(error, null);
            equal(res, "This is not an error, man!");
            equal(more, false);
            start();
        });
    });

    asyncTest("Normal int method", 3, function() {
        invoke("add42", [30], function(error, res, more) {
            equal(error, null);
            equal(res, 72);
            equal(more, false);
            start();
        });
    });

    asyncTest("Streaming method", 18, function() {
        var nextExpected = 10;

        invoke("iter", [10, 20, 2], function(error, res, more) {
            equal(error, null);

            if(nextExpected == 20) {
                equal(res, undefined);
                equal(more, false);
                start();
            } else {
                equal(res, nextExpected);
                equal(more, true);
                nextExpected += 2;
            }
        });
    });

    asyncTest("Simple error", 3, function() {
        invoke("simpleError", [], function(error, res, more) {
            equal(error.message, "This is an error, man!");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Object error", 3, function() {
        invoke("objectError", [], function(error, res, more) {
            equal(error.message, "This is an error object, man!");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Stream error", 3, function() {
        invoke("streamError", [], function(error, res, more) {
            equal(error.message, "This is a stream error, man!");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Calling a non-existent method", 3, function() {
        invoke("non_existent", [], function(error, res, more) {
            ok(error);
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Timeouts", 3, function() {
        client.invoke("test", "quiet", [], {timeout: 5}, function(error, res, more) {
            equal(error.name, "TimeoutExpired");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad client", 3, function() {
        client.invoke("bad-test", "add42", [30], function(error, res, more) {
            equal(error.name, "ServiceDoesNotExist");
            equal(res, null);
            equal(more, false);
            start();
        });
    });
}
