var MAX_IDENTIFIER_LENGTH = 1024,
    MAX_USERNAME_LENGTH = 128,
    MAX_PASSWORD_LENGTH = 128,
    IDENTIFIER_VALIDATOR = /^[a-zA-Z_][a-zA-Z_0-9]+$/;

//Validates an identifier
function checkIdentifier(identifier, name) {
    if(typeof(identifier) !== 'string') throw "expected " + name + " to be a string";
    if(identifier.length > MAX_IDENTIFIER_LENGTH) throw name + " is too long";
    if(!IDENTIFIER_VALIDATOR.test(identifier)) throw "invalid " + name;
}

//Validates a username
function validateUsername(username) {
    if(typeof(username) !== 'string') throw "expected username to be a string";
    if(username.length > MAX_USERNAME_LENGTH) throw "username is too long";
}

//Validates a password
function validatePassword(password) {
    if(typeof(password) !== 'string') throw "expected password to be a string";
    if(password.length > MAX_PASSWORD_LENGTH) throw "password is too long";
}

//Validates an invocation request
function validateInvocation(service, method, args) {
    checkIdentifier(service, "service");
    checkIdentifier(method, "method");
}

function validateRegistration(service, endpoint) {
    checkIdentifier(service, "service");
    //TODO: validate endpoint
}

//Creates an object that mimicks the error objects received from remote ZeroRPC services
function createSyntheticError(name, message) {
    return {
        name: name,
        message: message,
        traceback: null
    };
}

exports.validateUsername = validateUsername;
exports.validatePassword = validatePassword;
exports.validateInvocation = validateInvocation;
exports.createSyntheticError = createSyntheticError;