var readyCount = 0;
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

var client = new stack.io("http://localhost:8080", "test:test-password", function(error) {
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
        testIntegration();
    }
}

function invoke(method, args, callback) {
    client.invoke("test", method, args, callback);
}