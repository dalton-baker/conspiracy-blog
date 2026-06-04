import { json } from '@sveltejs/kit';
import {
    normalizeEmail,
    isValidEmail,
    generateCode,
    hashCode,
    CODE_TTL_MS,
    RESEND_INTERVAL_MS,
    MAX_CODES_PER_EMAIL_PER_HOUR,
    MAX_CODES_PER_IP_PER_HOUR
} from '$lib/serverAuth.js';
import { buildLoginEmail } from '$lib/loginEmail.js';

const HOUR_MS = 60 * 60 * 1000;

function clientIp(request, getClientAddress) {
    return request.headers.get('CF-Connecting-IP') || getClientAddress?.() || 'unknown';
}

export async function POST({ request, platform, getClientAddress }) {
    const db = platform.env.FORUM_D1;

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ message: 'Invalid request' }, { status: 400 });
    }

    const email = normalizeEmail(body?.email);
    if (!isValidEmail(email)) {
        return json({ message: 'Enter a valid email address' }, { status: 400 });
    }

    const ip = clientIp(request, getClientAddress);
    const now = Date.now();

    // There is at most one row per email (it's the primary key), so all the
    // per-email rate-limit state lives on that single row — no purging needed.
    const existing = await db
        .prepare(`SELECT created_at, window_start, send_count FROM login_codes WHERE email = ?`)
        .bind(email)
        .first();

    // Minimum gap between sends for a single email.
    if (existing && now - existing.created_at < RESEND_INTERVAL_MS) {
        const wait = Math.ceil((RESEND_INTERVAL_MS - (now - existing.created_at)) / 1000);
        return json(
            { message: `Please wait ${wait}s before requesting another code` },
            { status: 429 }
        );
    }

    // Rolling hourly cap per email, tracked on the row.
    let windowStart;
    let sendCount;
    if (!existing || now - existing.window_start >= HOUR_MS) {
        windowStart = now;
        sendCount = 1;
    } else if (existing.send_count >= MAX_CODES_PER_EMAIL_PER_HOUR) {
        return json(
            { message: 'Too many codes requested for this email. Try again later.' },
            { status: 429 }
        );
    } else {
        windowStart = existing.window_start;
        sendCount = existing.send_count + 1;
    }

    // Per-IP cap: distinct emails this IP has requested codes for in the last hour.
    const ipCount = await db
        .prepare(`SELECT COUNT(*) AS n FROM login_codes WHERE ip = ? AND created_at > ?`)
        .bind(ip, now - HOUR_MS)
        .first();

    if ((ipCount?.n ?? 0) >= MAX_CODES_PER_IP_PER_HOUR) {
        return json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // Issue a fresh code, overwriting any previous one for this email.
    const code = generateCode();
    const codeHash = await hashCode(email, code, platform.env);

    await db
        .prepare(
            `INSERT INTO login_codes (email, code_hash, ip, attempts, created_at, expires_at, window_start, send_count)
             VALUES (?, ?, ?, 0, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET
                 code_hash    = excluded.code_hash,
                 ip           = excluded.ip,
                 attempts     = 0,
                 created_at   = excluded.created_at,
                 expires_at   = excluded.expires_at,
                 window_start = excluded.window_start,
                 send_count   = excluded.send_count`
        )
        .bind(email, codeHash, ip, now, now + CODE_TTL_MS, windowStart, sendCount)
        .run();

    // Send the email. A named "from" (e.g. "Dalton Auth <noreply@...>") makes
    // clients show a friendlier sender than the bare address.
    const { subject, text, html } = buildLoginEmail(code);
    const fromEmail = platform.env.AUTH_FROM_EMAIL || 'noreply@truth.dalt.dev';
    const fromName = platform.env.AUTH_FROM_NAME || 'Dalton Auth';
    const from = { email: fromEmail, name: fromName };

    try {
        await platform.env.EMAIL.send({ from, to: email, subject, text, html });
    } catch (err) {
        console.error('Email send failed:', err);
        return json({ message: 'Could not send the login email. Try again shortly.' }, { status: 502 });
    }

    return json({ ok: true });
}
