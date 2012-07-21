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