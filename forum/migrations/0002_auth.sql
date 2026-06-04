-- Passwordless email auth: one-time login codes + server-side sessions.
-- Applies after 0001_initial_migration.sql.
--
-- Apply with:
--   npx wrangler d1 migrations apply conspiracy-forum --local
--   npx wrangler d1 migrations apply conspiracy-forum --remote
--
-- The existing `users` table is untouched; email remains the link between a
-- session and a user.

-- One login code per email address (email is the primary key, upserted on each
-- request). The table can therefore never hold more rows than the number of
-- people who have ever logged in, so it never needs purging. The hourly
-- send-rate counters live on the row itself.
CREATE TABLE IF NOT EXISTS login_codes (
    email         TEXT    PRIMARY KEY COLLATE NOCASE,
    code_hash     TEXT,                          -- hashed current code; blanked once used
    ip            TEXT,                          -- IP of the most recent request
    attempts      INTEGER NOT NULL DEFAULT 0,    -- wrong guesses against the current code
    created_at    INTEGER NOT NULL,              -- when the current code was issued
    expires_at    INTEGER NOT NULL,              -- current code expiry
    window_start  INTEGER NOT NULL,              -- start of the current hourly send window
    send_count    INTEGER NOT NULL DEFAULT 0     -- sends within the current window
);

-- Supports the per-IP "distinct emails in the last hour" rate-limit check.
CREATE INDEX IF NOT EXISTS idx_login_codes_ip ON login_codes (ip, created_at);

-- Active sessions. Only the hash of the session token is stored, so a DB leak
-- never exposes a usable cookie value. Expired rows are purged opportunistically
-- on login and when a session is read.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash  TEXT    PRIMARY KEY,
    email       TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_email   ON sessions (email);
