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

function Chat() {
    this.clients = {};
}

Chat.prototype.listen = function(handle, reply) {
    if(arguments.length !== 2 || typeof(handle) !== 'string' || handle.length > 50) {
        return arguments[arguments.length - 1]("Invalid handle");
    } else if(handle in this.clients) {
        return reply("Handle is already taken");
    }

    this.clients[handle] = reply;
    this._message({type: "connected", handle: handle});
}

Chat.prototype.message = function(handle, text, reply) {
    if(arguments.length !== 3 || typeof(handle) !== 'string' || handle.length > 50 || typeof(text) != 'string' || text.length > 200) {
        return arguments[arguments.length - 1]("Invalid message");
    }

    this._message({type: "chat", handle: handle, text: text});
    reply();
};

Chat.prototype._message = function(message) {
    for(var handle in this.clients) {
        try {
            this.clients[handle](null, message, true);
        } catch(e) {
            delete this.clients[handle];
            this._message({type: "disconnected", handle: handle});
        }
    }
};

stack.io(null, function(error, client) {
    client.expose("chat", new Chat());

    client.on("error", function(error) {
        console.error(error);
    });
});
