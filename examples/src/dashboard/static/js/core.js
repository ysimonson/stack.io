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

var services = {};
var readyCount = 0;
var client = null;

function ready() {
    readyCount++;
    if(readyCount === 2) start();
}

function start() {
    var username = $.cookie("username");
    var password = $.cookie("password");

    $("#loginForm").submit(function(e) {
        e.preventDefault();
        $.cookie("username", $("#loginUsername").val());
        $.cookie("password", $("#loginPassword").val());
        window.location.reload();
    });

    $("#introspectorService").change(function(e) {
        e.preventDefault();
        introspectService(inputValue($(this)));
    });

    $("#rpcService").change(function(e) {
        e.preventDefault();
        rpcService(inputValue($(this)));
    });

    $("#rpcMethod").change(function(e) {
        e.preventDefault();
        rpcMethod(inputValue($("#rpcService")), inputValue($(this)));
    });

    var showLogin = function() {
        transition($("#loading"), $("#login"));
    };

    var showContent = function(permissions) {
        transition($("#loading"), $("#content"));

        var permissionsTable = tmpl("authorizationPermissionsTemplate", {
            permissions: permissions
        });

        $("#authorizationUsername").text(username);
        $("#authorizationPermissions").append($(permissionsTable));

        $(".serviceSelector").append($("<option>"));

        for(var service in client._services) {
            $(".serviceSelector").append($("<option>").text(service));
        }
    };

    var showInitializationError = function(message) {
        transition($("#loading"), $("#initError"));
        $("#initErrorMessage").text(message);
    };

    var loggedIn = function(error, permissions) {
        if(error) {
            if(error.name == "NotAuthenticated") {
                showInitializationError("Authentication failed.");
            } else {
                showInitializationError("Unknown error [" + error.name + "]: " + error.message);
                console.error(error);
            }
        } else {
            var introspectedCount = 0;
            var services = client.services();

            for(var i=0; i<services.length; i++) {
                (function(service) {
                    client.use(service, function(error) {
                        if(error) {
                            console.error("Could not use service " + service + ":", error);
                        }

                        introspectedCount++;
                        if(introspectedCount == services.length) showContent(permissions);
                    });
                })(services[i]);
            }
        }
    };

    if(username && password) {
        client.login(username, password, loggedIn);
    } else {
        showLogin();
    }
}

stack.io({host: "http://" + window.location.hostname + ":8080"}, function(error, clt) {
    client = clt;
    
    if(error) {
        console.error(error);
    } else {
        ready();
    }
});

$(ready);