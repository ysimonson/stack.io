import zerorpc
import optparse

parser = optparse.OptionParser()
parser.add_option("-e", "--endpoint", dest="endpoint", default="tcp://0.0.0.0:27615", help="The ZeroMQ endpoint to bind to")

class Registrar(object):
    """Maintains a simple mapping of service name to 0mq endpoint"""

    def __init__(self, endpoint):
        self._services = {}
        self.register("registrar", endpoint)

    def service(self, name):
        """Gets the endpoint of a specific service"""
        return self._services.get(name)

    def services(self):
        """Gets the names of all services"""
        return self._services.keys()

    def services_verbose(self):
        """Gets a map of service name to endpoint of all services"""
        return self._services

    def register(self, name, endpoint):
        """Registers a new service"""
        self._services[name] = endpoint

    def unregister(self, name):
        """Unregisters a service"""
        del self._services[name]

def main():
    options, args = parser.parse_args()
    server = zerorpc.Server(Registrar(options.endpoint))
    server.bind(options.endpoint)
    server.run()

if __name__ == "__main__":
    main()