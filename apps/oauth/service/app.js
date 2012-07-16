var stack = require("./stack");

stack.io(null, function(error, client) {
    client.expose("twitter-test", "tcp://127.0.0.1:4242", {
        allowed: function(reply) {
            reply(null, "allowed");
        },

        notAllowed: function(reply) {
            reply("not allowed");
        }
    });
});
