var client = null;

$(function() {
    var token = $.cookie("token");
    var loginModal = $("#loginModal");
    loginModal.modal({ show: false });

    $("#doLogin").click(function(e) {
        e.preventDefault();
        $("#loginForm").submit();
    });

    $("#loginForm").submit(function(e) {
        e.preventDefault();
        loginModal.modal("hide");
        var token = $("#username").val() + ":" + $("#password").val();
        $.cookie("token", token);
        window.location.refresh();
    });

    if(token) {
        client = new stack.io("http://localhost:8080", token, ready);
    } else {
        loginModal.modal("show");
    }
});

function ready(error, id, permissions) {
    if(error) {
        console.error(error);
    } else {
        //
    }
}