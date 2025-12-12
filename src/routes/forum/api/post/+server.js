import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
    const db = platform.env.FORUM_D1;

    const result = await db
        .prepare(`
            SELECT
                p.id,
                p.title,
                u.username,
                p.created_at,
                MAX(c.created_at) AS last_comment_at,
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
                last_comment_at DESC NULLS LAST,
                p.created_at DESC
        `)
        .all();

    return json(result.results ?? []);
}

export async function POST({ request, platform }) {
    try {
        const email = request.headers.get('cf-access-authenticated-user-email');
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
