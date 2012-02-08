var stackio = require('../');
stackio.debug = true;
var test = require('tap').test;

test('internals_listen', function(t) {
    var io = stackio();
    io.on('_listen', function(arg) {
        if (arg != '_listen') {
            t.equal(arg, 'test_event', 'got test_event');
            t.end();
        }
    });
    io.on('test_event', function() {});
});

test('internals_remove', function(t) {
    var io = stackio();
    io.on('_listeners_removed', function(arg) {
        t.equal(arg, 'test_event', 'got test_event');
        t.end();
    });
    io.on('test_event', function() {});
    io.removeAllListeners('test_event');
});

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
