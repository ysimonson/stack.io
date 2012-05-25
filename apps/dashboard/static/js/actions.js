function logout() {
    $.cookie("token", null);
    window.location.reload();
}

function introspectService(service) {
    var content = tmpl("introspectorResultsTemplate", { methods: services[service] });
    $("#introspectorResults").empty().append($(content));
}