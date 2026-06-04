import { json } from '@sveltejs/kit';
import { getAuthenticatedEmail } from '$lib/serverAuth.js';

export async function GET({ cookies, platform }) {
    const email = await getAuthenticatedEmail({ cookies, platform });
    if (!email) return new Response('Unauthorized', { status: 401 });

    const db = platform.env.FORUM_D1;

    // grab all posts joined to their user names, newest first
    const result = await db
        .prepare(`
			SELECT
                p.id,
                p.title,
                u.username,
                COALESCE(MAX(c.created_at), p.created_at) AS last_activity_at,
                COUNT(c.id) AS comment_count
            FROM posts AS p
            LEFT JOIN users AS u
                ON p.user_id = u.id
            LEFT JOIN comments AS c
                ON c.post_id = p.id
            GROUP BY
                p.id,
                p.title,
                u.username,
                p.created_at
            ORDER BY
                last_activity_at DESC
		`)
        .all();

    // result.results holds rows when using .all()
    return json(result.results ?? []);
}

export async function POST({ request, cookies, platform }) {
    try {
        const email = await getAuthenticatedEmail({ cookies, platform });
        if (!email) return new Response('Unauthorized', { status: 401 });

        const db = platform.env.FORUM_D1;
        const body = await request.json();

        const title = body.title?.trim();
        const content = body.body?.trim();

        if (!title || !content)
            return new Response('Missing title or body', { status: 400 });

        // Lookup user by email (COLLATE NOCASE ensures case-insensitive match)
        const user = await db
            .prepare(`SELECT id, username FROM users WHERE email = ?`)
            .bind(email)
            .first();

        if (!user) return new Response('User not found', { status: 404 });

        const result = await db
            .prepare(`INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)`)
            .bind(user.id, title, content)
            .run();

        return json({ id: result.meta.last_row_idewId });
    } catch (err) {
        console.error('Comment error:', err);
        return new Response('Failed to create post', { status: 500 });
    }
}
