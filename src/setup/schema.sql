CREATE TABLE users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    token_hash CHAR(44) NOT NULL
);

CREATE TABLE groups (
    id SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL,
    UNIQUE (name)
);

CREATE TABLE user_groups (
    user_id INT UNSIGNED REFERENCES users(id),
    group_id SMALLINT UNSIGNED REFERENCES groups(id)
);

CREATE TABLE permissions (
    group_id SMALLINT UNSIGNED REFERENCES groups(id),
    pattern TEXT NOT NULL
);