var logout = require("./logout"),
    normalLogin = require("./normalLogin"),
    validator = require("./validator"),
    sessionInitializer = require("./oauth/sessionInitializer"),
    oauthLogin = require("./oauth/login");

function useOAuth(server, connector, providers) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /_stackio/, /getLoginUrl/, sessionInitializer(providers));
    server.middleware(connector, /_stackio/, /login/, oauthLogin);
}

function useNormalAuth(server, connector, registrarEndpoint) {
    applySharedMiddleware(server, connector);
    server.middleware(connector, /_stackio/, /login/, normalLogin(registrarEndpoint));
}

function applySharedMiddleware(server, connector) {
    server.middleware(connector, /_stackio/, /logout/, logout);
    server.middleware(connector, /(?!_stackio)^.+$/, /.+/, validator);
}

exports.useOAuth = useOAuth;
exports.useNormalAuth = useNormalAuth;