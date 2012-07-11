var zerorpc = require("zerorpc");
var UPDATE_RATE = 0;

function Mice() {
    var self = this;

    self.clients = {};
    self.clientIdCounter = 0;
    self.updates = [];

    setInterval(function() {
        self._sendUpdate();
    }, UPDATE_RATE);
}

Mice.prototype._numClients = function() {
    var count = 0;
    for(var key in this.clients) count++;
    return count;
};

Mice.prototype._sendUpdate = function() {
    var message = { type: "updates", payload: this.updates };
    this.updates = [];

    for(var clientId in this.clients) {
        try {
            this.clients[clientId].listener(undefined, message, true);
        } catch(e) {
            console.error(e);
            this._enqueueUpdate("unlisten", clientId);
            delete this.clients[clientId];
        }
    }

    this._enqueueUpdate("stats", this._numClients());
};

Mice.prototype._enqueueUpdate = function(type, value) {
    this.updates.push({ type: type, value: value })
};

Mice.prototype.move = function(clientId, x, y, reply) {
    this.clients[clientId].pos = [x, y];
    this._enqueueUpdate("move", { id: clientId, pos: [x, y] });
    reply(null, null, false);
};

Mice.prototype.listen = function(reply) {
    var myClientId = this.clientIdCounter++;
    var otherClientStates = [];

    for(var clientId in this.clients) {
        otherClientStates.push(this.clients[clientId].state);
    };

    this.clients[myClientId] = {
        listener: reply,
        id: myClientId,
        pos: [0, 0]
    };

    reply(undefined, {
        type: "initial",
        id: myClientId,
        count: this._numClients(),
        clients: otherClientStates
    }, true);
};

var server = new zerorpc.Server(new Mice());
server.bind("tcp://0.0.0.0:4242");

server.on("error", function(error) {
    console.error("Server error:", error);
});

var client = new zerorpc.Client();
client.connect("tcp://127.0.0.1:27615");

client.invoke("register", "mice", "tcp://127.0.0.1:4242", function(error, res, more) {
    if(error) {
        console.error(error);
        return process.exit(-1);
    }
});