function cleanMethods(methods) {
    var methodsObj = {};

    for(var i=0; i<methods.length; i++) {
        var method = methods[i];
        var args = method[1][0];

        var aClone = [];
        for(var j=0; j<args.length; j++) aClone.push(args[j]);

        methodsObj[method[0]] = {
            args: args,
            doc: method[2]
        };
    }

    return methodsObj;
}