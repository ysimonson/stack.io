import zerorpc
import optparse

parser = optparse.OptionParser()
parser.add_option("-e", "--endpoint", dest="endpoint", default="tcp://0.0.0.0:27615", help="The ZeroMQ endpoint to bind to")

#TODO: validation?

class Registrar(object):
    def __init__(self):
        self._services = {}

    def service(self, name):
        return self._services.get(name)

    def services(self):
        return self._services.keys()

    def services_verbose(self):
        return self._services

    def register(self, name, endpoint):
        self._services[name] = endpoint

    def unregister(self, name):
        del self._services[name]

def main():
    options, args = parser.parse_args()
    server = zerorpc.Server(Registrar())
    server.bind(options.endpoint)
    server.run()

if __name__ == "__main__":
    main()