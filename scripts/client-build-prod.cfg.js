({
    baseUrl: '../build',
    out: '../bin/client/web/stack.io.js',
    name: '../lib/client/almond',
    include: ['stack.io'],
    paths: {
        'socket.io': '../lib/client/socket.io'
    },
    wrap: {
        start: "(function() {",
        end: "require(['stack.io'],function(stack){window.stack = stack;});window.stack = {io:function(){var args = arguments;require(['stack.io'],function(stack){stack.io.apply(null, args);});}}})();"
    }
})