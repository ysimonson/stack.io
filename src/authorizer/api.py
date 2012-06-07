import itertools
import hashlib
import base64

GET_GROUP_BY_ID = "SELECT * FROM groups WHERE id=?"
GET_GROUP_BY_NAME = "SELECT * FROM groups WHERE name=?"
ADD_GROUP = "INSERT INTO groups (name) VALUE (?)"
REMOVE_GROUP = "DELETE FROM groups WHERE id=?"

GET_ALL_GROUPS = "SELECT * FROM groups"

GET_GROUP_PERMISSIONS = "SELECT pattern FROM permissions WHERE group_id=?"
CLEAR_PERMISSIONS_BY_GROUP_ID = "DELETE FROM permissions WHERE group_id=?"
ADD_PERMISSION = "INSERT INTO permissions (group_id, pattern) VALUES (?, ?)"
REMOVE_PERMISSION = "DELETE FROM permissions WHERE group_id=? AND pattern=?"

GET_USER_BY_ID = "SELECT * FROM users WHERE id=?"
GET_USER_BY_TOKEN_HASH = "SELECT * FROM users WHERE token_hash=?"
ADD_USER = "INSERT INTO users (token_hash) VALUE (?)"
REMOVE_USER = "DELETE FROM users WHERE id=?"

GET_USER_GROUPS_BY_USER_ID = "SELECT groups.id AS id, groups.name AS name FROM groups, user_groups WHERE groups.id=user_groups.group_id AND user_groups.user_id=?"
CLEAR_USER_GROUPS_BY_USER_ID = "DELETE FROM user_groups WHERE user_id=?"
ADD_USER_GROUP_BY_USER_ID = "INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)"
REMOVE_USER_GROUP_BY_USER_ID = "DELETE FROM user_groups WHERE user_id=? AND group_id=?"

GET_USER_GROUPS_BY_GROUP_ID = "SELECT user_id AS id FROM user_groups WHERE user_groups.group_id=?"
CLEAR_USER_GROUPS_BY_GROUP_ID = "DELETE FROM user_groups WHERE group_id=?"
ADD_USER_GROUP_BY_GROUP_ID = "INSERT INTO user_groups (group_id, user_id) VALUES (?, ?)"
REMOVE_USER_GROUP_BY_GROUP_ID = "DELETE FROM user_groups WHERE group_id=? AND user_id=?"

def zip_with_id(id, items):
    """Zips the items list with a cycle of id"""
    return zip(itertools.cycle((id,)), items)

def get_hash(str):
    """Gets the SHA-256 hex string of an input"""
    m = hashlib.sha256()
    m.update(str)
    return base64.b64encode(m.digest())

class Authorizer(object):
    def __init__(self, conn):
        self.conn = conn

    def get_all_groups(self):
        """Gets all of the groups"""
        return self.conn.query(GET_ALL_GROUPS)

    def get_group_by_id(self, id):
        """Gets a group by its ID"""
        return self.conn.get(GET_GROUP_BY_ID, id)

    def get_group_by_name(self, name):
        """Gets a group by its unique name"""
        return self.conn.get(GET_GROUP_BY_NAME, name)

    def add_group(self, name):
        """Adds a new group"""
        return self.conn.execute_lastrowid(ADD_GROUP, name)

    def remove_group(self, id):
        """Removes a group"""
        self.clear_group_permissions(id)
        self.clear_user_groups_by_group(id)
        self.conn.execute(REMOVE_GROUP, id)

    def get_group_permissions(self, id):
        """Gets the permissions associated with a group"""
        return self.conn.query(GET_GROUP_PERMISSIONS, id)

    def add_group_permissions(self, id, permissions):
        """Adds new permissions for a group"""
        self.conn.executemany(ADD_PERMISSION, zip_with_id(id, permissions))

    def remove_group_permissions(self, id, permissions):
        """Removes permissions for a group"""
        self.conn.executemany(REMOVE_PERMISSION, zip_with_id(id, permissions))

    def clear_group_permissions(self, id):
        """Clears the permissions for a group"""
        self.conn.execute(CLEAR_PERMISSIONS_BY_GROUP_ID, id)

    def get_user_by_id(self, id):
        """Gets a user by its ID"""
        return self.conn.get(GET_USER_BY_ID, id)

    def get_user_by_token(self, token):
        """Gets a user by its authentication token"""
        hash = get_hash(token)
        return self.conn.get(GET_USER_BY_TOKEN_HASH, hash)

    def add_user(self, token):
        """Adds a new user"""
        hash = get_hash(token)
        return self.conn.execute_lastrowid(ADD_USER, hash)

    def remove_user(self, id):
        """Removes a user"""
        self.clear_user_groups_by_user(id)
        self.conn.execute(REMOVE_USER, id)

    def get_user_groups_by_user(self, id):
        """Gets the groups associated with a user"""
        return self.conn.query(GET_USER_GROUPS_BY_USER_ID, id)

    def add_user_groups_by_user(self, user_id, group_ids):
        """Adds new groups to associate with a user"""
        self.conn.executemany(ADD_USER_GROUP_BY_USER_ID, zip_with_id(user_id, group_ids))

    def remove_user_groups_by_user(self, user_id, group_ids):
        """Removes groups to associate with a user"""
        self.conn.executemany(REMOVE_USER_GROUP_BY_USER_ID, zip_with_id(user_id, group_ids))

    def clear_user_groups_by_user(self, id):
        """Clears the groups associated with a user"""
        self.conn.execute(CLEAR_USER_GROUPS_BY_USER_ID, id)

    def get_user_groups_by_group(self, id):
        """Gets the groups associated with a user"""
        return self.conn.query(GET_USER_GROUPS_BY_GROUP_ID, id)

    def add_user_groups_by_group(self, group_id, user_ids):
        """Adds new groups to associate with a user"""
        self.conn.executemany(ADD_USER_GROUP_BY_GROUP_ID, zip_with_id(group_id, user_ids))

    def remove_user_groups_by_group(self, group_id, user_ids):
        """Removes groups to associate with a user"""
        self.conn.executemany(REMOVE_USER_GROUP_BY_GROUP_ID, zip_with_id(group_id, user_ids))

    def clear_user_groups_by_group(self, id):
        """Clears the groups associated with a user"""
        self.conn.execute(CLEAR_USER_GROUPS_BY_GROUP_ID, id)
