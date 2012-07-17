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
//registrarEndpoint : string
//      The ZeroMQ endpoint of the registrar
function useNormalAuth(server, connector, seedConfig) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /(?!_stackio)^.+$/, /.+/, normalValidator);
    server.middleware(connector, /_stackio/, /login/, normalLogin(seedConfig));
}

//Applies shared middleware used by both normal and OAuth mechanisms
function applySharedMiddleware(server, connector) {
    server.middleware(connector, /_stackio/, /logout/, logout);
}

exports.useOAuth = useOAuth;
exports.useNormalAuth = useNormalAuth;