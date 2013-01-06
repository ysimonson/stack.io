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

var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

var client;

stack.io({host: "http://localhost:8080", timeout: 5}, function(error, clt) {
    client = clt;
    module("Basics");

    test("Created", function() {
        ok(!error);
    })

    client.use("test", function(error, service) {
        equal(error, null);

        service.addMan("This is not an error", function(error, res, more) {
            equal(error, null);
            equal(res, "This is not an error, man!");
            equal(more, false);
            anonReady();
        });

        service.add42(30, function(error, res, more) {
            equal(error.name, "NotPermittedError");
            equal(res, null);
            equal(more, false);
            anonReady();
        });
    });
});

var testService = null;
var authService = null;
var anonReadyCount = 0;
var readyCount = 0;

$(ready);

function anonReady() {
    anonReadyCount++;

    if(anonReadyCount == 2) {
        start();

        asyncTest("Authenticated for testing", function() {
            client.login("test", "test-password", function(error) {
                ok(!error);

                client.use("test", function(error, service) {
                    equal(error, null);
                    testService = service;
                    ready();
                });

                client.use("auth", function(error, service) {
                    equal(error, null);
                    authService = service;
                    ready();
                });
            });
        });
    }
}

function ready() {
    readyCount++;

    if(readyCount == 3) {
        start();
        //testInvocation();
        //testAuth();
        testAccounts();
        //testValidation();
    }
}

function createBarrier(n, cont) {
    var count = 0;

    return function() {
        count++;
        if(count == n) cont();
    }
}