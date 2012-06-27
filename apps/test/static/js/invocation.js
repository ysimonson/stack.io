function testInvocation() {
    module("Invocation");
    
    asyncTest("Normal string method", 3, function() {
        testService.addMan("This is not an error", function(error, res, more) {
            equal(error, null);
            equal(res, "This is not an error, man!");
            equal(more, false);
            start();
        });
    });

    asyncTest("Normal int method", 3, function() {
        testService.add42(30, function(error, res, more) {
            equal(error, null);
            equal(res, 72);
            equal(more, false);
            start();
        });
    });

    asyncTest("Streaming method", 18, function() {
        var nextExpected = 10;

        testService.iter(10, 20, 2, function(error, res, more) {
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
        testService.simpleError(function(error, res, more) {
            equal(error.message, "This is an error, man!");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Object error", 3, function() {
        testService.objectError(function(error, res, more) {
            equal(error.message, "This is an error object, man!");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Stream error", 3, function() {
        testService.streamError(function(error, res, more) {
            equal(error.message, "This is a stream error, man!");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Timeouts", 4, function() {
        testService.quiet(function(error, res, more) {
            ok(error);
            equal(error.name, "TimeoutExpired");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad service", 2, function() {
        client.use("bad_test", function(error, service) {
            ok(error);
            equal(service, null);
            start();
        });
    });
}
