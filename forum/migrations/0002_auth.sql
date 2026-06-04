-- Passwordless email auth: one-time login codes + server-side sessions.
-- Apply with:
--   npx wrangler d1 migrations apply conspiracy-forum --local
--   npx wrangler d1 migrations apply conspiracy-forum --remote
--
-- The existing `users` table (email, username, id, last_login) is untouched;
-- email remains the link between a session and a user.

-- One-time login codes emailed to users. Codes are stored hashed (SHA-256),
-- are single-use (`consumed`), expire quickly, and double as the rate-limit log.
CREATE TABLE IF NOT EXISTS login_codes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL,
    code_hash   TEXT    NOT NULL,
    ip          TEXT,
    attempts    INTEGER NOT NULL DEFAULT 0,
    consumed    INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_codes_email   ON login_codes (email, created_at);
CREATE INDEX IF NOT EXISTS idx_login_codes_ip      ON login_codes (ip, created_at);
CREATE INDEX IF NOT EXISTS idx_login_codes_expires ON login_codes (expires_at);

-- Active sessions. Only the hash of the session token is stored, so a DB leak
-- never exposes a usable cookie value.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash  TEXT    PRIMARY KEY,
    email       TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_email   ON sessions (email);
