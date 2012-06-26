var MAX_IDENTIFIER_LENGTH = 1024,
    MAX_USERNAME_LENGTH = 128,
    MAX_PASSWORD_LENGTH = 128,
    IDENTIFIER_VALIDATOR = /^[a-zA-Z_][a-zA-Z_0-9]+$/,
    OPTIONS_CHECKS = { timeout: 'number' };

//Validates an identifier
function checkIdentifier(identifier, name) {
    if(typeof(identifier) !== 'string') throw "expected " + name + " to be a string";
    if(identifier.length > MAX_IDENTIFIER_LENGTH) throw name + " is too long";
    if(!IDENTIFIER_VALIDATOR.test(identifier)) throw "invalid " + name;
}

function validateCallback(obj) {
    if(typeof(obj) != 'function') throw "expected a function";
}

function validateNumber(name, obj) {
    if(typeof(obj) != 'number') throw "expected " + name + " to be a number";
}

//Validates an invocation request
function validateInvocation(service, method, args) {
    checkIdentifier(service, "service");
    checkIdentifier(method, "method");
    if(!(args instanceof Array)) throw "expected args to be an array";
}

function validateOptions(options) {
    if(typeof(options) != 'object') throw "expected options to be an object";

    for(var key in OPTIONS_CHECKS) {
        if(key in options) {
            if(typeof(options[key]) != OPTIONS_CHECKS[key]) {
                throw "option '" + key + "' is of the incorrect type; expected a(n) " + expectedType;
            }
        }
    }
}

//Creates an object that mimicks the error objects received from remote ZeroRPC services
function createSyntheticError(name, message) {
    return {
        name: name,
        message: message,
        traceback: null
    };
}

exports.validateCallback = validateCallback;
exports.validateNumber = validateNumber;
exports.validateInvocation = validateInvocation;
exports.validateOptions = validateOptions;
exports.createSyntheticError = createSyntheticError;