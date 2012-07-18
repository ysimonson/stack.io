var readyCount = 0;
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

function createBarrier(n, cont) {
    var count = 0;

    return function() {
        count++;
        if(count == n) cont();
    }
}