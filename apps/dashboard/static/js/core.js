//TODO: this is a giant bucket of spaghetti
var client = null;

function logout() {
    $.cookie("token", null);
    window.location.reload();
}

function showError(container, title, message, append) {
    var content = tmpl("errorTemplate", {
        title: title,
        message: message
    });

    if(!append) $(container).empty();
    $(container).prepend($(content));
}

function inputValue(input) {
    return $.trim(input.val());
}

function rpcInvoke(service, method, args) {
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

function introspectService(service) {
    var container = $("#serviceIntrospector");

    client.invoke(service, "_zerorpc_inspect", [], function(error, res, more) {
        if(error) {
            showError(container, "Could not introspect on the service", error.message, false);
        } else {
            var content = tmpl("serviceIntrospectorTemplate", {
                methods: res.methods
            });

            $("#serviceIntrospector").empty().append($(content));
        }
    });
}

function introspectRpcService(service) {
    var methodsCache = {};
    var methodSelector = $("#rpcMethodSelector");
    methodSelector.empty();

    client.invoke(service, "_zerorpc_inspect", [], function(error, res, more) {
        if(error) {
            showError($("#rpcResults"), "Could not introspect on the service", error.message, false);
        } else {
            methodSelector.append($("<option>"));

            for(var i=0; i<res.methods.length; i++) {
                var method = res.methods[i];
                var methodName = method[0];
                var methodArgs = method[1][0];
                methodArgs.shift();

                methodSelector.append($("<option>").text(methodName));
                methodsCache[methodName] = methodArgs;
            }
        }
    });

    methodSelector.change(function(e) {
        e.preventDefault();

        var method = inputValue($(this));

        var content = tmpl("rpcArgsTemplate", {
            args: methodsCache[method]
        });

        $("#rpcArgs").empty().append($(content));

        $("#rpcArgs form").submit(function(e) {
            e.preventDefault();
            $("span", this).empty();
            $(".control-group", this).removeClass("error");

            var args = [];
            var hasErrors = false;

            $("#rpcArgs input").each(function(i) {
                var rawValue = inputValue($(this));

                try {
                    args.push(JSON.parse(rawValue));
                } catch(e) {
                    var controls = $($("#rpcArgs input")[i]).parent()
                    controls.parent().addClass("error");
                    $("span", controls).text("Invalid JSON");
                    hasErrors = true;
                }
            });

            if(!hasErrors) rpcInvoke(service, method, args);
        });
    });
}

$(function() {
    var authorization = $("#authorization"),
        introspector = $("#introspector"),
        rpc = $("#rpc"),
        loginModal = $("#loginModal");

    var loadingTemplate = tmpl("loadingTemplate", {}),
        authorizationTemplate = tmpl("authorizationTemplate"),
        introspectorTemplate = tmpl("introspectorTemplate"),
        rpcTemplate = tmpl("rpcTemplate");

    var token = $.cookie("token");

    var showLoading = function(container) {
        container.empty().append($(loadingTemplate));
    };

    var showLogin = function() {
        $("#doLogin").click(function(e) {
            e.preventDefault();
            $("#loginForm").submit();
        });

        $("#loginForm").submit(function(e) {
            e.preventDefault();
            loginModal.modal("hide");
            var token = $("#username").val() + ":" + $("#password").val();
            $.cookie("token", token);
            window.location.reload();
        });

        loginModal.modal();
    };

    var setupAuthorization = function() {
        authorization.empty().append(authorizationTemplate({
            userId: client.userId,
            permissions: client.permissions.join("\n")
        }));
    };

    var setupIntrospector = function() {
        introspector.empty().append(introspectorTemplate({
            services: client.services
        }));

        $("#serviceSelector").change(function(e) {
            e.preventDefault();
            introspectService(inputValue($(this)));
        });
    };

    var setupRpc = function() {
        rpc.empty().append(rpcTemplate({
            services: client.services
        }));

        $("#rpcServiceSelector").change(function(e) {
            e.preventDefault();
            introspectRpcService(inputValue($(this)));
        });
    };

    var ready = function(error) {
        if(error) {
            if(error.name == "NotAuthenticated") {
                alert("Login failed");
                logout();
            } else {
                alert("Unknown error (see the console): " + error.message);
                console.error(error);
            }
        } else {
            setupAuthorization();
            setupIntrospector();
            setupRpc();
        }
    };

    showLoading(authorization);
    showLoading(introspector);
    showLoading(rpc);

    if(token) {
        client = new stack.io("http://localhost:8080", token, ready);
    } else {
        showLogin();
    }
});
