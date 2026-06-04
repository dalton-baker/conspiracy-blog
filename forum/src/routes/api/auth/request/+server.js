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

    // --- Housekeeping -----------------------------------------------------
    // A login_codes row is only useful within the rate-limit window (codes
    // expire well before then), and rows are only ever created here, so this
    // keeps the table bounded to ~1 hour of login activity — no cron needed.
    await db.prepare(`DELETE FROM login_codes WHERE created_at < ?`).bind(now - HOUR_MS).run();

    // --- Rate limiting ----------------------------------------------------
    // Minimum gap between sends for a single email.
    const last = await db
        .prepare(`SELECT created_at FROM login_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1`)
        .bind(email)
        .first();

    if (last && now - last.created_at < RESEND_INTERVAL_MS) {
        const wait = Math.ceil((RESEND_INTERVAL_MS - (now - last.created_at)) / 1000);
        return json(
            { message: `Please wait ${wait}s before requesting another code` },
            { status: 429 }
        );
    }

    // Hourly caps per email and per IP.
    const emailCount = await db
        .prepare(`SELECT COUNT(*) AS n FROM login_codes WHERE email = ? AND created_at > ?`)
        .bind(email, now - HOUR_MS)
        .first();

    if ((emailCount?.n ?? 0) >= MAX_CODES_PER_EMAIL_PER_HOUR) {
        return json(
            { message: 'Too many codes requested for this email. Try again later.' },
            { status: 429 }
        );
    }

    const ipCount = await db
        .prepare(`SELECT COUNT(*) AS n FROM login_codes WHERE ip = ? AND created_at > ?`)
        .bind(ip, now - HOUR_MS)
        .first();

    if ((ipCount?.n ?? 0) >= MAX_CODES_PER_IP_PER_HOUR) {
        return json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // --- Issue a fresh code ----------------------------------------------
    // Invalidate any previously outstanding code so only the newest works.
    await db
        .prepare(`UPDATE login_codes SET consumed = 1 WHERE email = ? AND consumed = 0`)
        .bind(email)
        .run();

    const code = generateCode();
    const codeHash = await hashCode(email, code, platform.env);

    await db
        .prepare(
            `INSERT INTO login_codes (email, code_hash, ip, attempts, consumed, created_at, expires_at)
             VALUES (?, ?, ?, 0, 0, ?, ?)`
        )
        .bind(email, codeHash, ip, now, now + CODE_TTL_MS)
        .run();

    // --- Send the email ---------------------------------------------------
    const { subject, text, html } = buildLoginEmail(code);
    const from = platform.env.AUTH_FROM_EMAIL || 'noreply@truth.dalt.dev';

    try {
        await platform.env.EMAIL.send({ from, to: email, subject, text, html });
    } catch (err) {
        console.error('Email send failed:', err);
        return json({ message: 'Could not send the login email. Try again shortly.' }, { status: 502 });
    }

    return json({ ok: true });
}
