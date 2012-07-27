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

var chat = null;
var readyCount = 0;

function transition(from, to) {
    from.fadeOut(250, function() {
        to.fadeIn(250);
    });
}

function ready() {
    readyCount++;
    if(readyCount === 2) start();
}

stack.io({host: "http://localhost:8080"}, function(error, client) {
    if(error) {
        return console.error(error);
    }

    client.login("demo", "demo-password", function(error) {
        if(error) {
            return console.error(error);
        }

        client.use("chat", function(error, context) {
            if(error) {
                return console.error(error);
            }

            chat = context;
            ready();
        });
    });
});

$(ready);

function start() {
    $("#submit-login-form").removeAttr("disabled");

    $("#login-form").submit(function(e) {
        e.preventDefault();
        handleLogin();
        return false;
    });
}

function handleLogin() {
    var handle = $("#input-handle").val();
    var firstMessage = true;
    
    $("#input-handle-container").removeClass("error");
    $("#input-handle-error").text("");
    $("#submit-login-form").attr("disabled", "disabled");

    chat.listen(handle, function(error, res) {
        if(error) {
            console.error(error);
        }

        if(firstMessage) {
            if(error) {
                $("#input-handle-container").addClass("error");
                $("#input-handle-error").text(error.message);
                $("#submit-login-form").removeAttr("disabled");
            } else {
                setupChat(handle);
            }

            firstMessage = false;
        } else if(res) {
            incomingMessage(res);
        }
    });
}

function setupChat(handle) {
    $("#field-username").text(handle);

    $("#chat-form").submit(function(e) {
        e.preventDefault();
        outgoingMessage(handle, $("#input-message").val());
        return false;
    });

    transition($("#login"), $("#chat"));
}

function outgoingMessage(handle, text) {
    chat.message(handle, text, function(error) {
        if(error) console.error(error);
    });
}

function incomingMessage(message) {
    var li = $("<li>");

    if(message.type === "connected" || message.type === "disconnected") {
        li.append($("<span class='message-handle'>").text(message.handle));
        li.append($("<span class='message-content'>").text(" " + message.type));
    } else {
        li.append($("<span class='message-handle'>").text(message.handle));
        li.append($("<span class='message-content'>").text(": " + message.text));
    }

    $("#chat-messages").append(li);
}
