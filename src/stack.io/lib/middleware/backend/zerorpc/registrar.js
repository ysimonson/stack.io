module.exports = function(endpoint) {
    var services = {
        'registrar': endpoint
    };

    var registrar = {
        // Get the endpoint of a specific service
        service: function(name, cb) {
            cb(null, services[name]);
        },
        // Get the names of all services
        // If verbose is true, get a map of service name to endpoint of all services
        services: function(verbose, cb) {
            if (typeof verbose == 'function') {
                cb = verbose;
                verbose = false;
            }

            if (verbose) {
                cb(null, services);
            } else {
                cb(null, Object.keys(services));
            }
        },
        // Register a new service
        register: function(name, endpoint, cb) {
            services[name] = endpoint;
            cb(null, true);
        },
        // Unregister a service
        unregister: function(name, cb) {
            delete services[name];
            cb(null, true);
        }
    };

    return registrar;
}
