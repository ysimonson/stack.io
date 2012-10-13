// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var evts = require('events')

module.exports = function(endpoint) {
    var services = {
        'registrar': endpoint
    };

    var emitter = new evts.EventEmitter();

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
            emitter.emit('register', name, endpoint);
            cb(null, true);
        },
        // Unregister a service
        unregister: function(name, cb) {
            delete services[name];
            emitter.emit('unregister', name);
            cb(null, true);
        },

        subscribe: function(cb) {
            var onRegister = function(name, endpoint) {
                try {
                    cb(null, {
                        type: 'register',
                        name: name,
                        endpoint: endpoint
                    }, true);
                } catch (e) {
                    // Client disconnected, unsubscribe.
                    emitter.removeListener('register', onRegister);
                    emitter.removeListener('unregister', onUnregister);
                }
            }

            var onUnregister = function(name) {
                try {
                    cb(null, {
                        type: 'register',
                        name: name,
                        endpoint: endpoint
                    }, true);
                } catch (e) {
                    // Client disconnected, unsubscribe.
                    emitter.removeListener('register', onRegister);
                    emitter.removeListener('unregister', onUnregister);
                }
            }

            emitter.on('register', onRegister);

            emitter.on('unregister', onUnregister);
        }
    };

    return registrar;
}
