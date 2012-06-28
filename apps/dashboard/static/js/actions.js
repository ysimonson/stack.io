function logout() {
    $.cookie("username", null);
    $.cookie("password", null);
    window.location.reload();
}

function introspectService(service) {
    var container = $("#introspectorResults");
    container.empty();

    if(service) {
        var content = tmpl("introspectorResultsTemplate", {
            methods: client.services[service].introspected.methods
        });
        
        container.append($(content));
    }
}