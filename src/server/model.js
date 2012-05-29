var MAX_IDENTIFIER_LENGTH = 1024,
    MAX_TOKEN_LENGTH = 4096,
    IDENTIFIER_VALIDATOR = /^[a-zA-Z_][a-zA-Z_0-9]+$/;

function checkIdentifier(identifier, name) {
    if(typeof(identifier) !== 'string') throw "expected " + name + " to be a string";
    if(identifier.length > MAX_IDENTIFIER_LENGTH) throw name + " is too long";
    if(!IDENTIFIER_VALIDATOR.test(identifier)) throw "invalid " + name;
}

function validateAuthentication(token) {
    if(typeof(token) !== 'string') throw "expected token to be a string";
    if(token.length > MAX_TOKEN_LENGTH) throw "token is too long";
}

function validateInvocation(service, method, args, options) {
    checkIdentifier(service, "service");
    checkIdentifier(method, "method");
    
    if(!(args instanceof Array)) throw "expected args to be an array";
    if(typeof(options) !== 'object' || options instanceof Array) throw "expected options to be an object";

    for(var key in options) {
        if(key !== 'timeout' && key !== 'heartbeat') {
            throw "Unexpected key in options: " + key;
        }
    }


    if('timeout' in options && typeof(options.timeout) !== 'number') {
        throw "Invalid timeout";
    }

    if('heartbeat' in options && typeof(options.heartbeat) !== 'number') {
        throw "Invalid heartbeat";
    }
}

function createSyntheticError(name, message) {
    return {
        name: name,
        message: message,
        traceback: null
    };
}

exports.validateAuthentication = validateAuthentication;
exports.validateInvocation = validateInvocation;
exports.createSyntheticError = createSyntheticError;