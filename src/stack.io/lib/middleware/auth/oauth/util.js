var model = require("../../../model");

//Called by OAuth middleware when there is a login error
//req : object
//      The stack.io request object
//res : object
//      The stack.io response object
//error : object
//      The error object to return back
function loginError(req, res, error) {
    delete req.session.auth;
    var errorObj = model.createSyntheticError("AuthenticationError", error);
    res.update(errorObj, undefined, false);
}

//Called by OAuth middleware when the client provides bad arguments
//res : object
//      The stack.io response object
//msg : string
//      The error message
function badArgumentsError(res, msg) {
    var error = model.createSyntheticError("BadArgumentsError", msg);
    res.update(error, undefined, false);
}

exports.loginError = loginError;
exports.badArgumentsError = badArgumentsError;