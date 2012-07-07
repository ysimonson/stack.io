var readyCount = 0;
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

var client;

stack.io("http://localhost:8080", {timeout : 5}, function(error, clt) {
    client = clt;
    module("Basics");

    test("Created", function() {
        ok(!error);
    })

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
});

var testService = null;
var authService = null;

$(ready);

function ready() {
    readyCount++;

    if(readyCount == 3) {
        start();
        testInvocation();
        testAuth();
        testAccounts();
        testValidation();
    }
}

function objectsEquivalent(actual, expected) {
    for(var key in expected) {
        if(!(key in actual)) return false;
        if(actual[key] != expected[key]) return false;
    }

    return true;
}

function setsEquivalent(actual, expected) {
    if (actual == null && expected != null) return false;
    if(actual.length != expected.length) return false;

    for(var i=0; i<expected.length; i++) {
        var curExpected = expected[i];
        var isObj = typeof(curExpected) == 'object';
        var found = false;

        for(var j=0; j<actual.length; j++) {
            var curActual = actual[j];

            if((isObj && objectsEquivalent(curActual, curExpected)) || curActual == curExpected) {
                found = true;
                break;
            }
        }

        if(!found) return false;
    }

    return true;
}

function createBarrier(n, cont) {
    var count = 0;

    return function() {
        count++;
        if(count == n) cont();
    }
}