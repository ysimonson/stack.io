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

function testAccounts() {
    module("Account Manipulation");

    function setupAccounts(group, username, password, callback) {
        authService.addGroup(group, function(error, res, more) {
            equal(error, null);
            equal(res, null);
            equal(more, false);

            authService.addUser(username, password, function(error, res, more) {
                equal(error, null);
                equal(res, null);
                equal(more, false);
                callback();
            });
        });
    }

    function teardownAccounts(group, username) {
        var barrier = createBarrier(2, start);

        authService.removeUser(username, function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            barrier();
        });

        authService.removeGroup(group, function(error, res, more) {
            equal(error, null);
            equal(res, true);
            equal(more, false);
            barrier();
        }); 
    }

    // asyncTest("Manipulating group permissions", 21, function() {
    //     setupAccounts("test0-group", "test0", "pwd", function() {
    //         var additions = [{service: "auth", method: ".+"}, {service: "temp", method: ".+"}];

    //         authService.addGroupPermissions("test0-group", additions, function(error, res, more) {
    //             equal(error, null);
    //             equal(res, true);
    //             equal(more, false);

    //             var removals = [{service: "temp", method: ".+"}];

    //             authService.removeGroupPermissions("test0-group", removals, function(error, res, more) {
    //                 equal(error, null);
    //                 equal(res, true);
    //                 equal(more, false);

    //                 authService.clearGroupPermissions("test0-group", function(error, res, more) {
    //                     equal(error, null);
    //                     equal(res, true);
    //                     equal(more, false);
    //                     teardownAccounts("test0-group", "test0");
    //                 });
    //             });
    //         }); 
    //     });
    // });

    // asyncTest("Adding/removing user groups by user ID", 24, function() {
    //     setupAccounts("test1-group", "test1", "pwd", function() {
    //         authService.addUserGroups("test1", ["test1-group"], function(error, res, more) {
    //             equal(error, null);
    //             equal(res, true);
    //             equal(more, false);

    //             authService.getUserGroups("test1", function(error, res, more) {
    //                 equal(error, null);
    //                 deepEqual(res, [{name: "test1-group"}]);
    //                 equal(more, false);

    //                 authService.removeUserGroups("test1", ["test1-group"], function(error, res, more) {
    //                     equal(error, null);
    //                     equal(res, true);
    //                     equal(more, false);

    //                     authService.getUserGroups("test1", function(error, res, more) {
    //                         equal(error, null);
    //                         deepEqual(res, []);
    //                         equal(more, false);
    //                         teardownAccounts("test1-group", "test1");
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // });

    asyncTest("Adding/removing user groups by group ID", 24, function() {
        setupAccounts("test2-group", "test2", "pwd", function() {
            authService.addGroupMembers("test2-group", ["test2"], function(error, res, more) {
                equal(error, null);
                equal(res, true);
                equal(more, false);

                authService.getGroupMembers("test2-group", function(error, res, more) {
                    equal(error, null);
                    deepEqual(res, [{username: "test2"}]);
                    equal(more, false);

                    // authService.removeGroupMembers("test2-group", ["test2"], function(error, res, more) {
                    //     equal(error, null);
                    //     equal(res, true);
                    //     equal(more, false);

                    //     authService.getGroupMembers("test2-group", function(error, res, more) {
                    //         equal(error, null);
                    //         deepEqual(res, []);
                    //         equal(more, false);
                    //         teardownAccounts("test2-group", "test2");
                    //     });
                    // });
                });
            });
        });
    });
}