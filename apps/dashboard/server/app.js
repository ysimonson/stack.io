var server = require("./lib/zerorpc/server"),
    client = require("./lib/zerorpc/client");

var rpcServer = new server.Server();
rpcServer.bind("tcp://0.0.0.0:4242");

rpcServer.on("error", function(error) {
    console.error("RPC server error:", error);
});

rpcServer.expose({
    addMan: function(cb, sentence) {
        cb(null, sentence + ", man!");
    },

    add42: function(cb, n) {
        cb(null, n + 42);
    },

    iter: function(cb, from, to, step) {
        for(i=from; i<to; i+=step) {
            cb(null, i, true);
        }

        cb(null, undefined, false);
    },

    simpleError: function(cb) {
        cb("This is an error, man!", undefined, false);
    },

    objectError: function(cb) {
        cb(new Error("This is an error object, man!"), undefined, false);
    },

    streamError: function(cb) {
        cb("This is a stream error, man!", undefined, true);

        var error = false;
        
        try {
            cb(null, "Should not happen", false);
        } catch(e) {
            error = true;
        }

        if(!error) {
            throw new Error("An error should have been thrown");
        }
    },

    quiet: function(cb) {
        setTimeout(function() {
            cb(null, "Should not happen", false);
        }, 31 * 1000);
    },

    notAuthorized: function(cb) {
        cb(null, "Should not happen", false);
    }
});

var rpcClient = new client.Client();
rpcClient.connect("tcp://127.0.0.1:27615");
rpcClient.invoke("register", ["test", "tcp://127.0.0.1:4242"], function(error, res, more) {
    if(error) {
        console.error(error);
        return process.exit(-1);
    }
});