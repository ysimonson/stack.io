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

function rpcService(service) {
    var container = $("#rpcMethod");
    container.empty();

    if(service) {
        var content = tmpl("rpcMethodsTemplate", {
            methods: client._services[service].introspected.methods
        });    

        container.append($(content));
    }
}

function rpcMethod(service, method) {
    var args = client._services[service].introspected.methods[method].args;
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

        args.push(function(error, res, more) {
            if(error) {
                errorMessage(container, error.name, error.message, true);
            } else {
                container.prepend($("<pre>").text(JSON.stringify(res)));
            }
        });

        client.use(service, function(error, service) {
            if(error) {
                errorMessage(container, error.name, error.message, true);
            } else {
                service[method].apply(client, args);
            }
        });
    }
}