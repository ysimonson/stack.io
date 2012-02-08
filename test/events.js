var stackio = require('../');
stackio.debug = true;
var test = require('tap').test;

test('events_pubSub', function (t) {
    var io = stackio({type: 'pub/sub'});
    io.on('test_event', function (data) {
        t.equal(data, 42, 'got 42');
        t.end();
    });
    io.emit('test_event', 42);
});

test('events_pushPull', function (t) {
    var io = stackio({type: 'push/pull'});
    io.on('test_event', function (data) {
        t.equal(data, 42, 'got 42');
        t.end();
    });
    io.emit('test_event', 42);
});

test('events_multiArgs', function(t) {
    var io = stackio();
    io.on('test_event', function(arg1, arg2) {
        t.equal(arg1, 'toto', 'got toto');
        t.equal(arg2, 42, 'got 42');
        t.end();
    });
    io.emit('test_event', 'toto', 42);
});

setTimeout(function () {
    process.exit();
}, 1000);
