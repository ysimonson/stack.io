//Logs a user out by deleting the auth object in the user's session
module.exports = function(req, res, next) {
    delete req.session.auth;
    res.update(undefined, undefined, false);
}