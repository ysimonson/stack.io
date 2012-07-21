({
    baseUrl: '../src/client',
    out: '../bin/client/stack.io.debug.js',
    name: '../../scripts/almond',
    include: ['stack.io'],
    optimize: "none",
    paths: {
        'socket.io': '../../lib/socket.io'
    },
    wrap: {
        start: "(function() {",
        end: "require(['stack.io'],function(stack){window.stack = stack;});window.stack = {io:function(){var args = arguments;require(['stack.io'],function(stack){stack.io.apply(null, args);});}}})();"
    }
})