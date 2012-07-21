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

    asyncTest("Get group permissions and membership", 7, function() {
        var barrier = createBarrier(2, start);

        authService.getGroupPermissions("test", function(error, res, more) {
            equal(error, null);
            ok(res, "No response");
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
