({
    baseUrl: '../src/client',
    out: '../bin/client/stack.io-http.debug.js',
    name: '../../scripts/almond',
    include: ['stack.io-http'],
    optimize: "none",
    wrap: {
        start: "(function() {",
        end: "require(['stack.io-http'],function(stack){window.stack = stack;});window.stack = {io:function(){var args = arguments;require(['stack.io-http'],function(stack){stack.io.apply(null, args);});}}})();"
    }
})