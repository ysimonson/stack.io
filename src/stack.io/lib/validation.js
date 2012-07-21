// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var MAX_IDENTIFIER_LENGTH = 1024,
    MAX_USERNAME_LENGTH = 128,
    MAX_PASSWORD_LENGTH = 128,
    IDENTIFIER_VALIDATOR = /^[a-zA-Z_][a-zA-Z_0-9-]+$/,
    OPTIONS_CHECKS = { timeout: 'number' };

//Validates an identifier
function checkIdentifier(identifier, name) {
    if(typeof(identifier) !== 'string') throw "expected " + name + " to be a string" +
        ", got " + JSON.stringify(identifier) + "[" + typeof identifier + "] instead";
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

exports.validateCallback = validateCallback;
exports.validateNumber = validateNumber;
exports.validateInvocation = validateInvocation;
exports.validateOptions = validateOptions;