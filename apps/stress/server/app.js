var zerorpc = require("zerorpc");

var server = new zerorpc.Server({
    lazyIter: function(reply) {
        var i = 0;

        setInterval(function() {
            reply(null, i++, true);
        }, 0);
    }
});

server.bind("tcp://0.0.0.0:4242");

server.on("error", function(error) {
    console.error("RPC server error:", error);
});

var client = new zerorpc.Client();
client.connect("tcp://127.0.0.1:27615");
client.invoke("register", "stress", "tcp://127.0.0.1:4242", function(error, res, more) {
    if(error) {
        console.error(error);
        return process.exit(-1);
    }
});