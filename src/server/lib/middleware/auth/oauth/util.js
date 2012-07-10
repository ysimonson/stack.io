var model = require("../../../model");

function loginError(req, res, error) {
    delete req.session.auth;
    var errorObj = model.createSyntheticError("AuthenticationError", error);
    res.update(errorObj, undefined, false);
}

function badArgumentsError(res, msg) {
    var error = model.createSyntheticError("BadArgumentsError", "Bad arguments");
    res.update(error, undefined, false);
}

exports.loginError = loginError;
exports.badArgumentsError = badArgumentsError;