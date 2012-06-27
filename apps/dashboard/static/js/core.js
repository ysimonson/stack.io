var readyCount = 0;

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

    var showContent = function() {
        transition($("#loading"), $("#content"));

        $("#authorizationUsername").text(client.username);
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

    var loggedIn = function(error) {
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
                    client.invoke(service, "_zerorpc_inspect", null, true, function(error, res, more) {
                        if(error) {
                            console.error("Could not introspect on service " + service + ":", error);
                        }

                        introspectedCount++;
                        if(res) services[service] = cleanMethods(res.methods);
                        if(introspectedCount == client.services.length) showContent();
                    });
                })(client.services[i]);
            }
        }
    };

    console.log("ASDASD");

    if(username && password) {
        client.invoke("auth", "auth", username, password, loggedIn);
    } else {
        showLogin();
    }
}

var services = {};

var client = new stack.IO("http://localhost:8080", function(error) {
    if(error) {
        console.error(error);
    } else {
        ready();
    }
});

$(ready);