var dgram = require("dgram");

function sendMessage(port, json, callback) {
    var jsonString = JSON.stringify(json);
    var message = new Buffer(jsonString);
    var socket = dgram.createSocket("udp4");

    socket.send(message, 0, message.length, port, "localhost", function(err, bytes) {
        socket.close();

        if(err) {
            throw err;
        } else {
            callback(err);
        }
    });
}

exports.testAllowedInvoke = function(test) {
    var json = {
        service: "test",
        method: "addMan",
        args: ["foo"]
    };

    sendMessage(30000, json, test.done);
};

exports.testNotAllowedInvoke = function(test) {
    var json = {
        service: "test",
        method: "add42",
        args: [30]
    };

    sendMessage(30000, json, test.done);
};

exports.testInvalidServiceInvoke = function(test) {
    var json = {
        service: 0,
        method: "addMan",
        args: ["foo"]
    };

    sendMessage(30000, json, test.done);
};

exports.testInvalidMethodInvoke = function(test) {
    var json = {
        service: "test",
        method: 0,
        args: ["foo"]
    };

    sendMessage(30000, json, test.done);
};

exports.testInvalidArgsInvoke = function(test) {
    var json = {
        service: "test",
        method: "addMan",
        args: 0
    };

    sendMessage(30000, json, test.done);
};