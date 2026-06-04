/**
 * Passwordless email + session-cookie auth, backed by Cloudflare D1.
 *
 * Flow:
 *   1. POST /api/auth/request  -> email a one-time 6-digit code (stored hashed)
 *   2. POST /api/auth/verify   -> exchange a valid code for a session cookie
 *   3. POST /api/auth/logout   -> destroy the session
 *
 * The session cookie is an opaque high-entropy token. Only its hash is stored
 * in D1, so a database leak never exposes a live session. Login codes are
 * likewise stored hashed, are single-use, short-lived, and rate limited.
 */

// --- Tunables -------------------------------------------------------------

export const SESSION_COOKIE = 'dot_session';

// How long a login session lasts on the user's machine.
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// How long an emailed login code stays valid.
export const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Max wrong-code guesses before the active code is burned.
export const CODE_MAX_ATTEMPTS = 5;

// Rate limiting for requesting codes.
export const RESEND_INTERVAL_MS = 30 * 1000; // min gap between sends for an email
export const MAX_CODES_PER_EMAIL_PER_HOUR = 5;
export const MAX_CODES_PER_IP_PER_HOUR = 20;

// --- Hashing helpers ------------------------------------------------------

function pepper(env) {
    // Optional server-side secret. Set with: wrangler secret put AUTH_SECRET
    return env?.AUTH_SECRET ?? '';
}

async function sha256Hex(input) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hashSessionToken(token, env) {
    return sha256Hex(`${pepper(env)}|session|${token}`);
}

export function hashCode(email, code, env) {
    return sha256Hex(`${pepper(env)}|code|${normalizeEmail(email)}|${code}`);
}

// --- Value generators -----------------------------------------------------

export function generateCode() {
    // Uniform 6-digit code (000000-999999), no modulo bias.
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return String(buf[0] % 1_000_000).padStart(6, '0');
}

export function generateSessionToken() {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Email + cookie utilities --------------------------------------------

export function normalizeEmail(email) {
    return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sessionCookieOptions() {
    return {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: Math.floor(SESSION_TTL_MS / 1000)
    };
}

// --- Session lifecycle ----------------------------------------------------

/**
 * Create a session row and return the raw token to hand to the browser.
 */
export async function createSession(db, env, email) {
    const token = generateSessionToken();
    const tokenHash = await hashSessionToken(token, env);
    const now = Date.now();

    await db
        .prepare(`INSERT INTO sessions (token_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)`)
        .bind(tokenHash, normalizeEmail(email), now, now + SESSION_TTL_MS)
        .run();

    return token;
}

export async function destroySession(db, env, token) {
    if (!token) return;
    const tokenHash = await hashSessionToken(token, env);
    await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
}

/**
 * Resolve the authenticated email from the session cookie, or null.
 * Drop-in replacement for the old Supabase-token verification.
 */
export async function getAuthenticatedEmail({ cookies, platform }) {
    const token = cookies.get(SESSION_COOKIE);
    if (!token) return null;

    const db = platform.env.FORUM_D1;
    const tokenHash = await hashSessionToken(token, platform.env);

    const row = await db
        .prepare(`SELECT email, expires_at FROM sessions WHERE token_hash = ?`)
        .bind(tokenHash)
        .first();

    if (!row) return null;

    if (row.expires_at < Date.now()) {
        // Lazily clean up expired sessions as we encounter them.
        await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
        return null;
    }

    return row.email;
}
