import zerorpc
import database
import sys
import api
import optparse

try:
    import json
except:
    import simplejson as json

AUTH_ENDPOINT = "tcp://0.0.0.0:27616"

parser = optparse.OptionParser()
parser.add_option("-o", "--dbhost", dest="dbhost", default="localhost:3306", help="The database host:port")
parser.add_option("-n", "--dbname", dest="dbname", default="stackio_auth", help="The database name")
parser.add_option("-u", "--dbuser", dest="dbuser", default="stackio_auth", help="The database user")
parser.add_option("-p", "--dbpass", dest="dbpass", default="volkswagon", help="The database password")

def exit(message):
    """
    Exits the program with a -1 return code and a message printed to stderr
    """
    print >> sys.stderr, message
    sys.exit(-1)

def get_json_content(path):
    """Gets the JSON content of a path"""
    try:
        with open(path) as f:
            return json.load(f)
    except Exception, e:
        exit("Could not read JSON file %s: %s" % (path, e))

def seed(auth, config):
    """Inserts data from a seed JSON file"""

    #Insert each group
    for name, service_permissions in config['groups'].iteritems():
        if auth.has_group(name):
            auth.clear_group_permissions(name)
        else:
            auth.add_group(name)

        for service_permission, method_permissions in service_permissions.iteritems():
            permissions = [{"service": service_permission, "method": method_permission}
                for method_permission in method_permissions]
            auth.add_group_permissions(name, permissions)

    #Insert each user
    for username, data in config['users'].iteritems():
        password = data['password']
        groups = data['groups']

        if auth.has_user(username):
            if not auth.check_auth(username, password):
                raise Exception, "Could not authenticate user %s" % username

            auth.clear_user_groups_by_user(username)
        else:
            auth.add_user(username, password)

        auth.add_user_groups_by_user(username, groups)

def main():
    options, args = parser.parse_args()

    conn = database.Connection(options.dbhost, options.dbname, user=options.dbuser, password=options.dbpass)
    auth = api.Authorizer(conn)

    if len(args) > 0:
        seed_config = get_json_content(args[0])
        seed(auth, seed_config)

    #Register the API
    registrar = zerorpc.Client()
    registrar.connect("tcp://127.0.0.1:27615")
    registrar.register("auth", AUTH_ENDPOINT)
    registrar.close()

    #Run the API
    server = zerorpc.Server(auth)
    server.bind(AUTH_ENDPOINT)
    server.run()

if __name__ == "__main__":
    main()