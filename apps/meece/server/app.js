var zerorpc = require("zerorpc");
var UPDATE_RATE = 10;

function Meece() {
    var self = this;

    self.clients = {};
    self.clientIdCounter = 0;
    self.updates = [];

    setInterval(function() {
        self._sendUpdate();
    }, UPDATE_RATE);
}

Meece.prototype._numClients = function() {
    var count = 0;
    for(var key in this.clients) count++;
    return count;
};

Meece.prototype._sendUpdate = function() {
    var message = { type: "updates", payload: this.updates };
    this.updates = [];

    for(var clientId in this.clients) {
        try {
            this.clients[clientId].listener(undefined, message, true);
        } catch(e) {
            console.error("*********", e);
            this._enqueueUpdate("unlisten", clientId);
            delete this.clients[clientId];
        }
    }

    this._enqueueUpdate("stats", this._numClients());
};

Meece.prototype._enqueueUpdate = function(type, value) {
    this.updates.push({ type: type, value: value })
};

Meece.prototype.move = function(clientId, x, y, reply) {
    var state = this.clients[clientId].state;
    state.pos = [x, y];
    this._enqueueUpdate("move", state);
    reply(null, null, false);
};

Meece.prototype.listen = function(reply) {
    var myClientId = this.clientIdCounter++;
    var otherClientStates = [];

    for(var clientId in this.clients) {
        otherClientStates.push(this.clients[clientId].state);
    };

    this.clients[myClientId] = {
        listener: reply,
        state: { id: myClientId, pos: [0, 0] }
    };

    reply(undefined, {
        type: "initial",
        id: myClientId,
        count: this._numClients(),
        clients: otherClientStates
    }, true);
};

var server = new zerorpc.Server(new Meece());
server.bind("tcp://0.0.0.0:4242");

var client = new zerorpc.Client();
client.connect("tcp://127.0.0.1:27615");

client.invoke("register", "meece", "tcp://127.0.0.1:4242", function(error, res, more) {
    if(error) {
        console.error(error);
        return process.exit(-1);
    }
});