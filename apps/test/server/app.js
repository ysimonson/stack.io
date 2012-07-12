var zerorpc = require("zerorpc");

var server = new zerorpc.Server({
    addMan: function(sentence, reply) {
        reply(null, sentence + ", man!", false);
    },

    add42: function(n, reply) {
        reply(null, n + 42, false);
    },

    iter: function(from, to, step, reply) {
        for(i=from; i<to; i+=step) {
            reply(null, i, true);
        }

        reply(null, undefined, false);
    },

    simpleError: function(reply) {
        reply("This is an error, man!", undefined, false);
    },

    objectError: function(reply) {
        reply(new Error("This is an error object, man!"), undefined, false);
    },

    streamError: function(reply) {
        reply("This is a stream error, man!", undefined, true);

        var error = false;
        
        try {
            reply(null, "Should not happen", false);
        } catch(e) {
            error = true;
        }

        if(!error) {
            throw new Error("An error should have been thrown");
        }
    },

    quiet: function(reply) {
        setTimeout(function() {
            try {
                reply(null, "Should not happen", false);
            } catch (e) {
                // do nothing
            }
        }, 31 * 1000);
    },

    notAuthorized: function(reply) {
        reply(null, "Should not happen", false);
    }
});

server.bind("tcp://0.0.0.0:4242");

server.on("error", function(error) {
    console.error("RPC server error:", error);
});

var client = new zerorpc.Client();
client.connect("tcp://127.0.0.1:27615");
client.invoke("register", "test", "tcp://127.0.0.1:4242", function(error, res, more) {
    if(error) {
        console.error(error);
        return process.exit(-1);
    }
});
