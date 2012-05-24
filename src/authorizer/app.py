import zerorpc
import database
import sys
import api

try:
    import json
except:
    import simplejson as json

def exit(message):
    print >> sys.stderr, message
    sys.exit(-1)

def get_json_content(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception, e:
        exit("Could not read JSON file %s: %s" % (path, e))

def seed(auth, config):
    for group_name, group_permissions in config['groups'].iteritems():
        group_data = auth.get_group_by_name(group_name)

        if group_data:
            group_id = group_data['id']
        else:
            group_id = auth.add_group(group_name)

        auth.clear_group_permissions(group_id)
        auth.add_group_permissions(group_id, group_permissions)

    for user in config['users']:
        user_groups = user['groups']
        user_token = user['token']
        user_data = auth.get_user_by_token(user_token)

        user_group_ids = []
        for user_group in user_groups:
            try:
                user_group_ids.append(auth.get_group_by_name(user_group)['id'])
            except Exception, e:
                error_template = "Tried to add user identified by '%s' to the group '%s', but the group does not exist: %s"
                exit(error_template % (user_token, user_group, e))

        if user_data:
            user_id = user_data['id']
        else:
            user_id = auth.add_user(user_token)

        auth.clear_user_groups(user_id)
        auth.add_user_groups(user_id, user_group_ids)

def main():
    if len(sys.argv) < 2:
        exit("No config file specified")

    config = get_json_content(sys.argv[1])
    auth_config = config['auth']

    if auth_config['type'] != 'mysql':
        exit('Authentication not configured to use mysql; bailing')

    host = "%s:%s" % (auth_config.get('host', 'localhost'), auth_config.get('port', 3306))
    db_name = auth_config['database']
    user = auth_config['user']
    password = auth_config['password']

    conn = database.Connection(host, db_name, user=user, password=password)
    auth = api.Authorizer(conn)

    if len(sys.argv) > 2:
        seed_config = get_json_content(sys.argv[2])
        seed(auth, seed_config)

    server = zerorpc.Server(auth)
    server.bind("tcp://0.0.0.0:27616")
    server.run()

    #TODO: register auth

if __name__ == "__main__":
    main()