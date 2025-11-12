-- Migration number: 0002 	 2025-11-12T03:38:21.288Z
-- Recreate the users table with COLLATE NOCASE on email and username
PRAGMA foreign_keys = OFF;

ALTER TABLE users RENAME TO users_old;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    username TEXT UNIQUE COLLATE NOCASE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

INSERT INTO users (id, email, username, joined_at, last_login)
SELECT id, email, username, joined_at, last_login
FROM users_old;

DROP TABLE users_old;

PRAGMA foreign_keys = ON;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
