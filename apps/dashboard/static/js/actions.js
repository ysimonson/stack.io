function logout() {
    $.cookie("token", null);
    window.location.reload();
}

function introspectService(service) {
    var container = $("#introspectorResults");
    container.empty();

    if(service) {
        var content = tmpl("introspectorResultsTemplate", { methods: services[service] });    
        container.append($(content));
    }
}