-- Initial schema for the conspiracy forum (users, posts, comments).
--
-- This reproduces the database state that was first applied to production on
-- 2025-12-22 under the same migration name. Because Wrangler tracks applied
-- migrations by filename, the production database (which already has this
-- migration recorded in d1_migrations) will SKIP this file, while any fresh or
-- local database will get the base schema before later migrations run.
--
-- Apply with:
--   npx wrangler d1 migrations apply conspiracy-forum --local
--   npx wrangler d1 migrations apply conspiracy-forum --remote

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    username    TEXT    UNIQUE COLLATE NOCASE,
    joined_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    last_login  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    body        TEXT    NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON posts(user_id);

CREATE TABLE IF NOT EXISTS comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    body        TEXT    NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id    ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id    ON comments(user_id);
