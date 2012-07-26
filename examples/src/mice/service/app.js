// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var stack = require("../../../bin/stack.io");
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

stack.io(null, function(error, client) {
    client.expose("mice", new Mice());
});
