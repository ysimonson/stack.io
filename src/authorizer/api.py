import itertools
import hashlib
import base64

GET_GROUP_BY_ID = "SELECT * FROM groups WHERE id=%s"
GET_GROUP_BY_NAME = "SELECT * FROM groups WHERE name=%s"
ADD_GROUP = "INSERT INTO groups (name) VALUE (%s)"
REMOVE_GROUP = "DELETE FROM groups WHERE id=%s"

GET_ALL_GROUPS = "SELECT * FROM groups"
GET_ALL_GROUPS_WITH_PERMISSIONS = "SELECT groups.id AS id, groups.name AS name, permissions.pattern FROM groups, permissions WHERE groups.id=permissions.group_id"

CLEAR_PERMISSIONS_BY_GROUP_ID = "DELETE FROM permissions WHERE group_id=%s"
ADD_PERMISSION = "INSERT INTO permissions (group_id, pattern) VALUES (%s, %s)"
REMOVE_PERMISSION = "DELETE FROM permissions WHERE group_id=%s AND pattern=%s"

GET_USER_BY_ID = "SELECT * FROM users WHERE id=%s"
GET_USER_BY_TOKEN_HASH = "SELECT * FROM users WHERE token_hash=%s"
ADD_USER = "INSERT INTO users (token_hash) VALUE (%s)"
REMOVE_USER = "DELETE FROM users WHERE id=%s"

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

    def get_all_groups(self, include_permissions):
        query = GET_ALL_GROUPS_WITH_PERMISSIONS if include_permissions else GET_ALL_GROUPS
        return self.conn.query(query)

    def get_group_by_id(self, id):
        return self.conn.get(GET_GROUP_BY_ID, id)

    def get_group_by_name(self, name):
        return self.conn.get(GET_GROUP_BY_NAME, name)

    def add_group(self, name):
        return self.conn.execute_lastrowid(add_group, name)

    def remove_group(self, id):
        self.conn.execute(REMOVE_GROUP, id)

    def add_group_permissions(self, id, permissions):
        self.conn.executemany(ADD_PERMISSION, zip_with_id(id, permissions))

    def remove_group_permissions(self, id, permissions):
        self.conn.executemany(REMOVE_PERMISSION, zip_with_id(id, permissions))

    def clear_group_permissions(self, id):
        self.conn.execute(CLEAR_PERMISSIONS_BY_GROUP_ID, id)

    def get_user_by_id(self, id):
        return self.conn.get(GET_USER_BY_ID, id)

    def get_user_by_token(self, token):
        hash = get_hash(token)
        return self.conn.get(GET_USER_BY_TOKEN_HASH, hash)

    def add_user(self, token):
        return self.conn.execute_lastrowid(ADD_USER, token)

    def remove_user(self, id):
        self.conn.execute(REMOVE_USER, id)

    def add_user_groups(self, user_id, group_ids):
        self.conn.executemany(ADD_USER_GROUP, zip_with_id(user_id, group_ids))

    def remove_user_groups(self, user_id, group_ids):
        self.conn.executemany(REMOVE_USER_GROUP, zip_with_id(user_id, group_ids))

    def clear_user_groups(self, id):
        self.conn.execute(CLEAR_USER_GROUPS_BY_USER_ID, id)