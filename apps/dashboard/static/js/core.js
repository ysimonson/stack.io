var client = null;
var services = {};

function logout() {
    $.cookie("token", null);
    window.location.reload();
}

function errorMessage(container, title, message, append) {
    var content = tmpl("errorTemplate", {
        title: title,
        message: message
    });

    if(!append) container.empty();
    container.prepend($(content));
}

function cleanMethods(methods) {
    var methodsObj = {};

    for(var i=0; i<methods.length; i++) {
        var method = methods[i];
        var args = method[1][0];
        args.shift();

        methodsObj[method[0]] = {
            args: args,
            doc: method[2]
        };
    }

    return methodsObj;
}

function inputValue(input) {
    return $.trim(input.val());
}

function transition(from, to) {
    from.fadeOut(250, function() {
        to.fadeIn(250);
    });
}

function introspectService(service) {
    var content = tmpl("introspectorResultsTemplate", { methods: services[service] });
    $("#introspectorResults").empty().append($(content));
}

function rpcService(service) {
    var methods = services[service];
    var content = tmpl("rpcMethodsTemplate", { methods: services[service] });
    $("#rpcMethod").empty().html($(content));
}

function rpcMethod(service, method) {
    var args = services[service][method].args;
    var content = tmpl("rpcArgsTemplate", { args: args });
    $("#rpcArgs").empty().append($(content));

    $("#rpcArgs form").submit(function(e) {
        e.preventDefault();
        rpcInvoke(service, method);
        return false;
    });
}

function rpcInvoke(service, method) {
    $("#rpcArgs span").empty();
    $("#rpcArgs .control-group").removeClass("error");

    var args = [];
    var hasErrors = false;

    $("#rpcArgs input").each(function(i) {
        var rawValue = inputValue($(this));

        try {
            args.push(JSON.parse(rawValue));
        } catch(e) {
            var controls = $($("#rpcArgs input")[i]).parent();
            controls.parent().addClass("error");
            $("span", controls).text("Invalid JSON");
            hasErrors = true;
        }
    });

    if(!hasErrors) {
        var container = $("#rpcResults");
        container.empty();

        client.invoke(service, method, args, function(error, res, more) {
            if(error) {
                showError(container, "RPC Error", error.message, true);
            } else {
                container.prepend($("<pre>").text(JSON.stringify(res)));
            }
        }); 
    }
}

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
                var service = client.services[i];

                client.invoke(service, "_zerorpc_inspect", [], function(error, res, more) {
                    if(error) {
                        showInitializationError("Could not introspect on service " + service + ": " + error.message + ".");
                    } else {
                        introspectedCount++;
                        services[service] = cleanMethods(res.methods);
                        if(introspectedCount == client.services.length) showContent();
                    }
                });
            }
        }
    };

    if(token) {
        client = new stack.io("http://localhost:8080", token, ready);
    } else {
        showLogin();
    }
});