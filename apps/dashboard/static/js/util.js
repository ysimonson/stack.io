function cleanMethods(methods) {
    var methodsObj = {};

    for(var i=0; i<methods.length; i++) {
        var method = methods[i];
        var args = method[1][0];
        args.shift();

        methodsObj[method[0]] = {
            args: args,
            doc: method[2]
        };
    }

    return methodsObj;
}