var nopt = require('nopt'),
    zerorpc = require('zerorpc');
var AUTH_ENDPOINT = "tcp://0.0.0.0:27616";

var options = nopt(
    { 'dbname': [String, null] },
    { '-n': '--dbname' },
    process.argv,
    2
);
options.dbname = options.dbname || 'stackio_auth';

function main() {
    var auth, authModule = require('./lib');
    if (options.argv.remain.length > 0) {
        auth = authModule(options.dbname, options.argv.remain[0]);
    } else {
        auth = authModule(options.dbname);
    }

    var registrar = new zerorpc.Client();
    registrar.connect("tcp://127.0.0.1:27615");
    registrar.invoke("register", "auth", AUTH_ENDPOINT, function(err) {
        if (err)
            console.error(err);
        registrar.close();
    });

    var server = new zerorpc.Server(auth);
    server.bind(AUTH_ENDPOINT);
    server.on('error', function(err) {
        console.error('Server Error!', err);
    });
}

main();