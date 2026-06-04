import { json } from '@sveltejs/kit';
import {
    normalizeEmail,
    hashCode,
    createSession,
    sessionCookieOptions,
    SESSION_COOKIE,
    CODE_MAX_ATTEMPTS
} from '$lib/serverAuth.js';

export async function POST({ request, platform, cookies }) {
    const db = platform.env.FORUM_D1;

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ message: 'Invalid request' }, { status: 400 });
    }

    const email = normalizeEmail(body?.email);
    const code = String(body?.code ?? '').trim();

    if (!email || !/^\d{6}$/.test(code)) {
        return json({ message: 'Enter the 6-digit code from your email' }, { status: 400 });
    }

    // One row per email. An empty code_hash means the code was already used.
    const row = await db
        .prepare(`SELECT code_hash, attempts, expires_at FROM login_codes WHERE email = ?`)
        .bind(email)
        .first();

    if (!row || !row.code_hash) {
        return json({ message: 'Invalid or expired code. Request a new one.' }, { status: 400 });
    }

    if (row.expires_at < Date.now()) {
        return json({ message: 'That code expired. Request a new one.' }, { status: 400 });
    }

    if (row.attempts >= CODE_MAX_ATTEMPTS) {
        return json({ message: 'Too many attempts. Request a new code.' }, { status: 429 });
    }

    const codeHash = await hashCode(email, code, platform.env);

    if (codeHash !== row.code_hash) {
        const attempts = row.attempts + 1;
        await db
            .prepare(`UPDATE login_codes SET attempts = ? WHERE email = ?`)
            .bind(attempts, email)
            .run();

        const remaining = CODE_MAX_ATTEMPTS - attempts;
        return json(
            {
                message:
                    remaining > 0
                        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
                        : 'Incorrect code. Request a new one.'
            },
            { status: 400 }
        );
    }

    // Success: blank the code so it can't be replayed (single-use), while keeping
    // the row so the per-email rate-limit counters persist.
    await db.prepare(`UPDATE login_codes SET code_hash = '' WHERE email = ?`).bind(email).run();

    // Opportunistically purge expired sessions so that table stays bounded too.
    await db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(Date.now()).run();

    const token = await createSession(db, platform.env, email);
    cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return json({ ok: true });
}
