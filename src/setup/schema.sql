CREATE TABLE users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(128) NOT NULL,
    password_hash CHAR(44) NOT NULL,
    UNIQUE (username)
);

CREATE TABLE groups (
    id SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL,
    UNIQUE (name)
);

CREATE TABLE user_groups (
    user_id INT UNSIGNED REFERENCES users(id),
    group_id SMALLINT UNSIGNED REFERENCES groups(id),
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE permissions (
    group_id SMALLINT UNSIGNED REFERENCES groups(id),
    pattern VARCHAR(128) NOT NULL,
    PRIMARY KEY (group_id, pattern)
);