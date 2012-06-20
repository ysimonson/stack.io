import zerorpc
import database
import sys
import api

try:
    import json
except:
    import simplejson as json

AUTH_ENDPOINT = "tcp://0.0.0.0:27616"

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
    for name, permissions in config['groups'].iteritems():
        if auth.has_group(None, name):
            auth.clear_group_permissions(None, name)
        else:
            auth.add_group(None, name)

        auth.add_group_permissions(None, name, permissions)

    #Insert each user
    for username, data in config['users'].iteritems():
        password = data['password']
        groups = data['groups']

        if auth.has_user(None, username):
            if not auth.authenticate_user(None, username, password):
                raise Exception, "Could not authenticate user %s" % username

            auth.clear_user_groups_by_user(None, username)
        else:
            auth.add_user(None, username, password)

        auth.add_user_groups_by_user(None, username, groups)

def main():
    if len(sys.argv) < 2:
        exit("No config file specified")

    config = get_json_content(sys.argv[1])
    auth_config = config['auth']

    #Do not run this if the authorization engine is not mysql
    if auth_config['type'] != 'mysql':
        exit('Authorization not configured to use mysql; bailing')

    host = "%s:%s" % (auth_config.get('host', 'localhost'), auth_config.get('port', 3306))
    db_name = auth_config['database']
    user = auth_config['user']
    password = auth_config['password']

    conn = database.Connection(host, db_name, user=user, password=password)
    auth = api.Authorizer(conn)

    if len(sys.argv) > 2:
        seed_config = get_json_content(sys.argv[2])
        seed(auth, seed_config)

    #Register the API
    registrar = zerorpc.Client()
    registrar.connect("tcp://127.0.0.1:27615")
    registrar.register("_stackio_auth", AUTH_ENDPOINT)
    registrar.close()

    #Run the API
    server = zerorpc.Server(auth)
    server.bind(AUTH_ENDPOINT)
    server.run()

if __name__ == "__main__":
    main()