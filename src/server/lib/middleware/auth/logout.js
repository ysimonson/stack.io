module.exports = function(req, res, next) {
    delete req.session.auth;
    res.update(undefined, undefined, false);
}