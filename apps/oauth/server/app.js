var zerorpc = require("zerorpc");

function TwitterTest() {
}

TwitterTest.prototype.allowed = function(reply) {
    reply("allowed");
};

TwitterTest.prototype.notAllowed = function(reply) {
    reply("not allowed");
};

var server = new zerorpc.Server(new TwitterTest());
server.bind("tcp://0.0.0.0:4242");

var client = new zerorpc.Client();
client.connect("tcp://127.0.0.1:27615");

client.invoke("register", "twitter-test", "tcp://127.0.0.1:4242", function(error, res, more) {
    if(error) {
        console.error(error);
        return process.exit(-1);
    }
});