function errorMessage(container, title, message, append) {
    var content = tmpl("errorTemplate", {
        title: title,
        message: message
    });

    if(!append) container.empty();
    container.prepend($(content));
}

function inputValue(input) {
    return $.trim(input.val());
}

function transition(from, to) {
    from.fadeOut(250, function() {
        to.fadeIn(250);
    });
}