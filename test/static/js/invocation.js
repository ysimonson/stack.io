// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

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

    test("Bad service", 1, function() {
        try {
            client.use("bad_test");
        } catch(e) {
            ok(e);
        }
    });
}
