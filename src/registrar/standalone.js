var zerorpc = require('zerorpc'),
    nopt = require('nopt');

var options = nopt(
    { 'endpoint': [String, null] },
    { '-e': '--endpoint' },
    process.argv,
    2
),
    endpoint = options.endpoint || 'tcp://0.0.0.0:27615';

var registrar = require('./lib')(endpoint);

var server = new zerorpc.Server(registrar);
server.bind(endpoint);
server.on('error', function(err) {
    console.error('Server Error!', err);
});