function rpcService(service) {
    var container = $("#rpcMethod");
    container.empty();

    if(service) {
        var content = tmpl("rpcMethodsTemplate", { methods: services[service] });    
        container.append($(content));
    }
}

function rpcMethod(service, method) {
    var args = services[service][method].args;
    var content = tmpl("rpcArgsTemplate", { args: args });
    $("#rpcArgs").empty().append($(content));

    $("#rpcArgs form").submit(function(e) {
        e.preventDefault();
        rpcInvoke(service, method, function() {});
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

        var callback = function(error, res, more) {
            if(error) {
                errorMessage(container, error.name, error.message, true);
            } else {
                container.prepend($("<pre>").text(JSON.stringify(res)));
            }
        };

        var invokeArgs = [service, method].concat(args).concat([callback]);
        client.invoke.apply(client, invokeArgs);
    }
}