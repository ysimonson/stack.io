var readyCount = 0;
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

var client = new stack.IO("http://localhost:8080", "test", "test-password", function(error) {
    module("Basics");

    test("Created", function() {
        ok(!error);
    })

    ready();
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

function invoke(method, args, callback) {
    client.invoke("test", method, args, callback);
}

function ainvoke(method, args, callback) {
    client.invoke("_stackio_auth", method, args, callback);
}

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