var logout = require("./logout"),
    normalLogin = require("./normal/login"),
    validator = require("./validator"),
    sessionInitializer = require("./oauth/sessionInitializer"),
    oauthLogin = require("./oauth/login");

//Sets up a server to use OAuth authentication
//server : object
//      The stack.io server
//connector : RegExp
//      The pattern for connector names that this should apply to
//providers : object
//      The OAuth provider configuration(s)
function useOAuth(server, connector, providers) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /_stackio/, /getLoginUrl/, sessionInitializer(providers));
    server.middleware(connector, /_stackio/, /login/, oauthLogin);
}

//Sets up a server to use normal authentication
//server : object
//      The stack.io server
//connector : RegExp
//      The pattern for connector names that this should apply to
//registrarEndpoint : string
//      The ZeroMQ endpoint of the registrar
function useNormalAuth(server, connector, seedConfig) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /_stackio/, /login/, normalLogin(seedConfig));
}

//Applies shared middleware used by both normal and OAuth mechanisms
function applySharedMiddleware(server, connector) {
    server.middleware(connector, /_stackio/, /logout/, logout);
    server.middleware(connector, /(?!_stackio)^.+$/, /.+/, validator);
}

exports.useOAuth = useOAuth;
exports.useNormalAuth = useNormalAuth;