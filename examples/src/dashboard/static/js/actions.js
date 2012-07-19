function logout() {
    $.cookie("username", null);
    $.cookie("password", null);

    client.logout(function() {
        window.location.reload();
    });
}

function introspectService(service) {
    var container = $("#introspectorResults");
    container.empty();

    if(service) {
        var content = tmpl("introspectorResultsTemplate", {
            methods: client._services[service].introspected.methods
        });
        
        container.append($(content));
    }
}