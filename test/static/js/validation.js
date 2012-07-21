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

function testValidation() {
    module("Validation");

    asyncTest("Bad service - non-string", 3, function() {
        client._invoke({}, "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad service - empty string", 3, function() {
        client._invoke("", "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad service - invalid identifier", 3, function() {
        client._invoke("0service", "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - non-string", 3, function() {
        client._invoke({}, "method", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - non-string", 3, function() {
        client._invoke("bad_test", {}, function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - empty string", 3, function() {
        client._invoke("bad_test", "", function(error, res, more) {
            equal(error.name, "RequestError");
            equal(res, null);
            equal(more, false);
            start();
        });
    });

    asyncTest("Bad method - invalid identifier", 3, function() {
        client._invoke("bad_test", "0method", function(error, res, more) {
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