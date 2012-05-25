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