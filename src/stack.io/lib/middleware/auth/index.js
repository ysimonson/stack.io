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

var logout = require("./logout"),
    normalLogin = require("./normal/login"),
    normalValidator = require("./normal/validator"),
    oauthSessionInitializer = require("./oauth/sessionInitializer"),
    oauthLogin = require("./oauth/login"),
    oauthValidator = require("./oauth/validator");

//Sets up a server to use OAuth authentication
//server : object
//      The stack.io server
//connector : RegExp
//      The pattern for connector names that this should apply to
//providers : object
//      The OAuth provider configuration(s)
function useOAuth(server, connector, providers) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /(?!_stackio)^.+$/, /.+/, oauthValidator);
    server.middleware(connector, /_stackio/, /getLoginUrl/, oauthSessionInitializer(providers));
    server.middleware(connector, /_stackio/, /login/, oauthLogin);
}

//Sets up a server to use normal authentication
//server : object
//      The stack.io server
//connector : RegExp
//      The pattern for connector names that this should apply to
//seedConfig : object
//      The initial normal auth users and groups
function useNormalAuth(server, connector, seedConfig) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /(?!_stackio)^.+$/, /.+/, normalValidator(seedConfig));
    server.middleware(connector, /_stackio/, /login/, normalLogin(seedConfig));
}

//Applies shared middleware used by both normal and OAuth mechanisms
function applySharedMiddleware(server, connector) {
    server.middleware(connector, /_stackio/, /logout/, logout);
}

exports.useOAuth = useOAuth;
exports.useNormalAuth = useNormalAuth;