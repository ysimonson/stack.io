var readyCount = 0;
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

var client = new stack.IO("http://localhost:8080", {timeout : 5}, function(error) {
    module("Basics");

    test("Created", function() {
        ok(!error);
    })

    asyncTest("Authenticated for testing", function() {
        client.invoke("auth", "auth", "test", "test-password", function(error) {
            ok(!error);
            start();
            ready();
        });
    });
});

$(ready);

function ready() {
    readyCount++;

    if(readyCount == 2) {
        testInvocation();
        testAuth();
        testAccounts();
        testValidation();
    }
}

function _createInvoker(service) {
    return function(method, args, callback) {
        var args = [service, method].concat(args).concat([callback]);
        client.invoke.apply(client, args);
    };
}

var invoke = _createInvoker("test");
var ainvoke = _createInvoker("auth");

function objectsEquivalent(actual, expected) {
    for(var key in expected) {
        if(!(key in actual)) return false;
        if(actual[key] != expected[key]) return false;
    }

    return true;
}

function setsEquivalent(actual, expected) {
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