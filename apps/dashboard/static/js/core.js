var client = null;
var services = {};

$(function() {
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

    var showContent = function() {
        transition($("#loading"), $("#content"));

        $("#authorizationId").text(client.userId);
        $("#authorizationPermissions").text(client.permissions.join("\n"));

        $(".serviceSelector").append($("<option>"));

        for(var service in services) {
            $(".serviceSelector").append($("<option>").text(service));
        }
    };

    var showInitializationError = function(message) {
        transition($("#loading"), $("#initError"));
        $("#initErrorMessage").text(message);
    };

    var ready = function(error) {
        if(error) {
            if(error.name == "NotAuthenticated") {
                showInitializationError("Authentication failed.");
            } else {
                showInitializationError("Unknown error [" + error.name + "]: " + error.message);
                console.error(error);
            }
        } else {
            var introspectedCount = 0;

            for(var i=0; i<client.services.length; i++) {
                (function(service) {
                    client.invoke(service, "_zerorpc_inspect", function(error, res, more) {
                        if(error) {
                            console.error("Could not introspect on service " + service + ":", error);
                        }
                        introspectedCount++;

                        if(res) {
                            services[service] = cleanMethods(res.methods);
                        }

                        if(introspectedCount == client.services.length) showContent();
                    });
                })(client.services[i]);
            }
        }
    };

    if(username && password) {
        client = new stack.IO({
            host: "http://localhost:8080",
            username: username,
            password: password,
            callback: ready
        });
    } else {
        showLogin();
    }
});