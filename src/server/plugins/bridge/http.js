module.exports = function(app, backend, authorizer, config) {
    var allowOrigin = function(req, res, next) {
        res.header("Access-Control-Allow-Origin", pluginConfig.origin);
        res.header("Access-Control-Allow-Headers", "Authorization,Content-Type");
        next();
    };

    

    /*expressApp.all("/produce", allowOrigin);
    expressApp.all("/consume", allowOrigin);
    expressApp.all("/consume/confirm", allowOrigin);

    expressApp.post("/produce", checkAuth, validateObj(model.validateProduceRequest), function(req, res) {
        backend.produce(req.user, req.body, function(obj) {
            res.send(obj, obj.error ? 400 : 200);
        });
    });

    expressApp.post("/consume", checkAuth, validateObj(model.validateConsumeRequest), function(req, res) {
        if(req.body.isComplex) {
            try {
                req.body.key = new RegExp(req.body.key);
            } catch(e) {
                return res.send(model.consumeResponse("Could not compile key"), 400);
            }
        }
    
        backend.consume(req.user, req.body, function(obj) {
            res.send(obj, obj.error ? 400 : 200);
        });
    });

    expressApp.post("/consume/confirm", checkAuth, validateObj(model.validateConfirmConsumeRequest), function(req, res) {
        backend.confirmConsume(req.user, req.body, function(obj) {
            res.send(obj, obj.error ? 400 : 200);
        });
    });*/
};
