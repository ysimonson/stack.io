import itertools
import hashlib
import base64

GET_GROUP_BY_ID = "SELECT * FROM groups WHERE id=%s"
GET_GROUP_BY_NAME = "SELECT * FROM groups WHERE name=%s"
ADD_GROUP = "INSERT INTO groups (name) VALUE (%s)"
REMOVE_GROUP = "DELETE FROM groups WHERE id=%s"

GET_ALL_GROUPS = "SELECT * FROM groups"

GET_GROUP_PERMISSIONS = "SELECT pattern FROM permissions WHERE group_id=%s"
CLEAR_PERMISSIONS_BY_GROUP_ID = "DELETE FROM permissions WHERE group_id=%s"
ADD_PERMISSION = "INSERT INTO permissions (group_id, pattern) VALUES (%s, %s)"
REMOVE_PERMISSION = "DELETE FROM permissions WHERE group_id=%s AND pattern=%s"

GET_USER_BY_ID = "SELECT * FROM users WHERE id=%s"
GET_USER_BY_TOKEN_HASH = "SELECT * FROM users WHERE token_hash=%s"
ADD_USER = "INSERT INTO users (token_hash) VALUE (%s)"
REMOVE_USER = "DELETE FROM users WHERE id=%s"

GET_USER_GROUPS = "SELECT groups.id AS id, groups.name AS name FROM groups, user_groups WHERE groups.id=user_groups.group_id AND user_groups.user_id=%s"
CLEAR_USER_GROUPS_BY_USER_ID = "DELETE FROM user_groups WHERE user_id=%s"
ADD_USER_GROUP = "INSERT INTO user_groups (user_id, group_id) VALUES (%s, %s)"
REMOVE_USER_GROUP = "DELETE FROM user_groups WHERE user_id=%s AND group_id=%s"

def zip_with_id(id, items):
    return zip(itertools.cycle((id,)), items)

def get_hash(str):
    m = hashlib.sha256()
    m.update(str)
    return base64.b64encode(m.digest())

class Authorizer(object):
    def __init__(self, conn):
        self.conn = conn

    def get_all_groups(self): ###
        """Gets all of the groups"""
        return self.conn.query(GET_ALL_GROUPS)

    def get_group_by_id(self, id): ###
        """Gets a group by its ID"""
        return self.conn.get(GET_GROUP_BY_ID, id)

    def get_group_by_name(self, name): ###
        """Gets a group by its unique name"""
        return self.conn.get(GET_GROUP_BY_NAME, name)

    def add_group(self, name): ###
        """Adds a new group"""
        return self.conn.execute_lastrowid(ADD_GROUP, name)

    def remove_group(self, id): ###
        """Removes a group"""
        self.conn.execute(REMOVE_GROUP, id)

    def get_group_permissions(self, id): ###
        """Gets the permissions associated with a group"""
        return self.conn.query(GET_GROUP_PERMISSIONS, id)

    def add_group_permissions(self, id, permissions): ###
        """Adds new permissions for a group"""
        self.conn.executemany(ADD_PERMISSION, zip_with_id(id, permissions))

    def remove_group_permissions(self, id, permissions):
        """Removes permissions for a group"""
        self.conn.executemany(REMOVE_PERMISSION, zip_with_id(id, permissions))

    def clear_group_permissions(self, id):
        """Clears the permissions for a group"""
        self.conn.execute(CLEAR_PERMISSIONS_BY_GROUP_ID, id)

    def get_user_by_id(self, id): ####
        """Gets a user by its ID"""
        return self.conn.get(GET_USER_BY_ID, id)

    def get_user_by_token(self, token): ####
        """Gets a user by its authentication token"""
        hash = get_hash(token)
        return self.conn.get(GET_USER_BY_TOKEN_HASH, hash)

    def add_user(self, token):
        """Adds a new user"""
        return self.conn.execute_lastrowid(ADD_USER, token)

    def remove_user(self, id):
        """Removes a user"""
        self.conn.execute(REMOVE_USER, id)

    def get_user_groups(self, id): ####
        """Gets the groups associated with a user"""
        return self.conn.query(GET_USER_GROUPS, id)

    def add_user_groups(self, user_id, group_ids):
        """Adds new groups to associate with a user"""
        self.conn.executemany(ADD_USER_GROUP, zip_with_id(user_id, group_ids))

    def remove_user_groups(self, user_id, group_ids):
        """Removes groups to associate with a user"""
        self.conn.executemany(REMOVE_USER_GROUP, zip_with_id(user_id, group_ids))

    def clear_user_groups(self, id):
        """Clears the groups associated with a user"""
        self.conn.execute(CLEAR_USER_GROUPS_BY_USER_ID, id)