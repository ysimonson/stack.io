var client = null;
var services = {};

$(function() {
    var token = $.cookie("token");

    $("#loginForm").submit(function(e) {
        e.preventDefault();
        var username = $("#loginUsername").val();
        var password = $("#loginPassword").val();
        var token = username + ":" + password;
        $.cookie("token", token);
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
                    client.invoke(service, "_zerorpc_inspect", [], function(error, res, more) {
                        if(error) {
                            var errorMsg = "Could not introspect on service " + service + ": " + error.message + ".";
                            showInitializationError(errorMsg);
                        } else {
                            introspectedCount++;
                            services[service] = cleanMethods(res.methods);
                            if(introspectedCount == client.services.length) showContent();
                        }
                    });
                })(client.services[i]);
            }
        }
    };

    if(token) {
        client = new stack.io("http://localhost:8080", token, ready);
    } else {
        showLogin();
    }
});