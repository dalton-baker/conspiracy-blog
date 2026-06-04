import { json } from '@sveltejs/kit';
import { getAuthenticatedEmail } from '$lib/serverAuth.js';

export async function GET({ cookies, platform }) {
    const email = await getAuthenticatedEmail({ cookies, platform });
    if (!email) return new Response('Unauthorized', { status: 401 });

    const db = platform.env.FORUM_D1;

    // Try to find an existing user (case-insensitive handled by COLLATE NOCASE)
    const existing = await db
        .prepare(`SELECT id, username FROM users WHERE email = ?`)
        .bind(email)
        .first();

    if (!existing) {
        // New user → insert a fresh record
        await db
            .prepare(`INSERT INTO users (email) VALUES (?)`)
            .bind(email)
            .run();

        const user = await db
            .prepare(`SELECT id, username FROM users WHERE email = ?`)
            .bind(email)
            .first();

        return json(user);
    }

    // Existing user → update their last login
    await db
        .prepare(`UPDATE users SET last_login = ? WHERE id = ?`)
        .bind(Date.now(), existing.id)
        .run();

    return json(existing);
}

export async function POST({ request, cookies, platform }) {
    const email = await getAuthenticatedEmail({ cookies, platform });
    if (!email) return new Response('Unauthorized', { status: 401 });

    const db = platform.env.FORUM_D1;
    const { username } = await request.json();

    // Basic validation
    if (!username || username.trim().length < 3 || username.trim().length > 30)
        return new Response('Username must be 3–30 characters long', { status: 400 });

    if (!/^[a-zA-Z0-9_]+$/.test(username))
        return new Response('Only letters, numbers, and underscores allowed', { status: 400 });

    const clean = username.trim();

    // Fetch user by email
    const user = await db
        .prepare(`SELECT id, username FROM users WHERE email = ?`)
        .bind(email)
        .first();

    if (!user) return new Response('User not found', { status: 404 });
    if (user.username)
        return new Response('Username already set and cannot be changed', { status: 403 });

    try {
        // ⚡ Attempt to set username directly — rely on UNIQUE constraint
        await db
            .prepare(`UPDATE users SET username = ? WHERE id = ?`)
            .bind(clean, user.id)
            .run();

        return json({ id: user.id, username: clean });
    } catch (err) {
        // D1 (SQLite) throws a constraint violation for UNIQUE COLLATE NOCASE conflicts
        if (err.message && err.message.includes('UNIQUE constraint failed: users.username')) {
            return new Response('Username already taken', { status: 409 });
        }

        console.error('Unexpected DB error:', err);
        return new Response('Database error', { status: 500 });
    }
}
