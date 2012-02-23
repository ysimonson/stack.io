var stackio = require('../');
stackio.debug = true;
var test = require('tap').test;

test('internals_expose', function(t) {
    var io = stackio();
    io.on('_new_rpc_service', function(arg) {
        t.equal(arg, 'TestService', 'got TestService');
        t.end();
    });
    io.expose('TestService', {
        test : function(x) { return x + 1; },
        decr : function(x) { return x - 1; }
    });
});

setTimeout(function () {
    process.exit();
}, 1000);
