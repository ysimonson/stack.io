var util = require("util");

//Prints requests as the come in
module.exports = function(req, res, next) {
    console.log("REQUEST", util.inspect(req, false, 4, true));
    next();
};