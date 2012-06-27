import itertools
import hashlib
import base64
import re

GET_GROUP_ID = "SELECT id FROM groups WHERE name=%s LIMIT 1"
ADD_GROUP = "INSERT INTO groups (name) VALUE (%s)"
REMOVE_GROUP = "DELETE FROM groups WHERE id=%s"
GET_ALL_GROUPS = "SELECT name FROM groups"

GET_GROUP_PERMISSIONS = "SELECT service, method FROM permissions WHERE group_id=%s"
CLEAR_PERMISSIONS = "DELETE FROM permissions WHERE group_id=%s"
ADD_PERMISSION = "INSERT INTO permissions (group_id, service, method) VALUES (%s, %s, %s)"
REMOVE_PERMISSION = "DELETE FROM permissions WHERE group_id=%s AND service=%s AND method=%s"

GET_USER_ID = "SELECT id FROM users WHERE username=%s LIMIT 1"
AUTHENTICATE_USER = "SELECT id FROM users WHERE username=%s AND password_hash=%s LIMIT 1"
ADD_USER = "INSERT INTO users (username, password_hash) VALUES (%s, %s)"
REMOVE_USER = "DELETE FROM users WHERE id=%s"

GET_USER_PERMISSIONS = """
SELECT DISTINCT permissions.service AS service, permissions.method AS method FROM permissions
    JOIN groups ON permissions.group_id=groups.id
    JOIN user_groups ON groups.id=user_groups.group_id
    JOIN users ON user_groups.user_id=users.id
    WHERE users.username=%s
"""

GET_USER_GROUPS_BY_USER = "SELECT groups.name AS name FROM groups, user_groups WHERE groups.id=user_groups.group_id AND user_groups.user_id=%s"
CLEAR_USER_GROUPS_BY_USER = "DELETE FROM user_groups WHERE user_id=%s"
ADD_USER_GROUP_BY_USER = "INSERT INTO user_groups (user_id, group_id) VALUES (%s, %s)"
REMOVE_USER_GROUP_BY_USER = "DELETE FROM user_groups WHERE user_id=%s AND group_id=%s"

GET_USER_GROUPS_BY_GROUP = "SELECT users.username AS username FROM users, user_groups WHERE users.id=user_groups.user_id AND user_groups.group_id=%s"
CLEAR_USER_GROUPS_BY_GROUP = "DELETE FROM user_groups WHERE group_id=%s"
ADD_USER_GROUP_BY_GROUP = "INSERT INTO user_groups (group_id, user_id) VALUES (%s, %s)"
REMOVE_USER_GROUP_BY_GROUP = "DELETE FROM user_groups WHERE group_id=%s AND user_id=%s"

def zip_single(first, seconds):
    return zip(itertools.cycle((first,)), seconds)

def get_hash(str):
    """Gets the SHA-256 hex string of an input"""
    m = hashlib.sha256()
    m.update(str)
    return base64.b64encode(m.digest())

class Authorizer(object):
    def __init__(self, conn):
        self.conn = conn

    def _bulk(self, query, first_id_fetcher, second_id_fetcher, first, seconds):
        first_id = first_id_fetcher(first)
        if first_id == None: return False

        second_ids = filter(lambda id: id != None, (second_id_fetcher(second) for second in seconds))
        self.conn.executemany(query, zip_single(first_id, second_ids))
        return True

    def _get_group_id(self, name):
        """Gets a group ID by its name"""
        result = self.conn.get(GET_GROUP_ID, name)
        return result['id'] if result else None

    def _get_user_id(self, username):
        """Gets a user ID by its username"""
        result = self.conn.get(GET_USER_ID, username)
        return result['id'] if result else None

    def check_auth(self, username, password):
        return self.conn.get(AUTHENTICATE_USER, username, get_hash(password)) != None

    def auth(self, username, password):
        """Checks if a user is authenticated"""
        if self.check_auth(username, password):
            return self.get_user_permissions(username)
        else:
            return []

    def has_group(self, name):
        return self.conn.get(GET_GROUP_ID, name) != None

    def add_group(self, name):
        """Adds a new group"""
        self.conn.execute(ADD_GROUP, name)

    def remove_group(self, name):
        """Removes a group"""
        id = self._get_group_id(name)
        if not id: return False

        self.conn.execute(CLEAR_PERMISSIONS, id)
        self.conn.execute(CLEAR_USER_GROUPS_BY_GROUP, id)
        self.conn.execute(REMOVE_GROUP, id)
        return True

    def get_all_groups(self):
        """Gets all of the groups"""
        return self.conn.query(GET_ALL_GROUPS)

    def get_group_permissions(self, name):
        """Gets the permissions associated with a group"""
        id = self._get_group_id(name)
        if not id: return None

        return self.conn.query(GET_GROUP_PERMISSIONS, id)

    def add_group_permissions(self, name, permissions):
        """Adds new permissions for a group"""
        id = self._get_group_id(name)
        if not id: return False

        #Validate regexes
        for permission in permissions:
            try:
                re.compile(permission['service'])
            except:
                raise Exception("Could not compile service pattern: %s" % permission["service"])

            try:
                re.compile(permission['method'])
            except:
                raise Exception("Could not compile method pattern: %s" % permission["method"])

        args = [(id, permission['service'], permission['method']) for permission in permissions]
        self.conn.executemany(ADD_PERMISSION, args)

        return True

    def remove_group_permissions(self, name, permissions):
        """Removes permissions for a group"""
        id = self._get_group_id(name)
        if not id: return False

        args = [(id, permission['service'], permission['method']) for permission in permissions]
        self.conn.executemany(REMOVE_PERMISSION, args)
        return True

    def clear_group_permissions(self, name):
        """Clears the permissions for a group"""
        id = self._get_group_id(name)
        if not id: return False

        self.conn.execute(CLEAR_PERMISSIONS, id)
        return True

    def has_user(self, username):
        return self.conn.get(GET_USER_ID, username) != None

    def add_user(self, username, password):
        """Adds a new user"""
        self.conn.execute(ADD_USER, username, get_hash(password))

    def remove_user(self, username):
        """Removes a user"""
        id = self._get_user_id(username)
        if not id: return False

        self.conn.execute(CLEAR_USER_GROUPS_BY_USER, id)
        self.conn.execute(REMOVE_USER, id)
        return True

    def get_user_permissions(self, username):
        """Gets the permissions for a user"""
        return self.conn.query(GET_USER_PERMISSIONS, username)

    def get_user_groups_by_user(self, username):
        """Gets the groups associated with a user"""
        id = self._get_user_id(username)
        if not id: return None

        return self.conn.query(GET_USER_GROUPS_BY_USER, id)

    def add_user_groups_by_user(self, username, groups):
        """Adds new groups to associate with a user"""
        return self._bulk(ADD_USER_GROUP_BY_USER, self._get_user_id, self._get_group_id, username, groups)

    def remove_user_groups_by_user(self, username, groups):
        """Removes groups to associate with a user"""
        return self._bulk(REMOVE_USER_GROUP_BY_USER, self._get_user_id, self._get_group_id, username, groups)

    def clear_user_groups_by_user(self, username):
        """Clears the groups associated with a user"""
        id = self._get_user_id(username)
        self.conn.execute(CLEAR_USER_GROUPS_BY_USER, id)

    def get_user_groups_by_group(self, name):
        """Gets the groups associated with a user"""
        id = self._get_group_id(name)
        if not id: return None

        return self.conn.query(GET_USER_GROUPS_BY_GROUP, id)

    def add_user_groups_by_group(self, group, usernames):
        """Adds new groups to associate with a user"""
        return self._bulk(ADD_USER_GROUP_BY_GROUP, self._get_group_id, self._get_user_id, group, usernames)

    def remove_user_groups_by_group(self, group, usernames):
        """Removes groups to associate with a user"""
        return self._bulk(REMOVE_USER_GROUP_BY_GROUP, self._get_group_id, self._get_user_id, group, usernames)

    def clear_user_groups_by_group(self, group):
        """Clears the groups associated with a user"""
        id = self._get_group_id(group)
        self.conn.execute(CLEAR_USER_GROUPS_BY_GROUP, id)
