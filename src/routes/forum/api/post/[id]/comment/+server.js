import { json } from '@sveltejs/kit';

export async function POST({ request, params, platform }) {
    try {
        const email = request.headers.get('cf-access-authenticated-user-email');
        if (!email) return new Response('Unauthorized', { status: 401 });

        const db = platform.env.FORUM_D1;
        const { id: postId } = params;

        const { body } = await request.json();
        const text = body?.trim();
        if (!text) return new Response('Empty comment', { status: 400 });

        // Get user record
        const user = await db
            .prepare(`SELECT id, username FROM users WHERE email = ?`)
            .bind(email)
            .first();

        if (!user) return new Response('User not found', { status: 404 });
        if (!user.username) return new Response('User has no username', { status: 400 });

        // Verify post exists
        const postExists = await db
            .prepare(`SELECT 1 FROM posts WHERE id = ?`)
            .bind(postId)
            .first();

        if (!postExists) return new Response('Post not found', { status: 404 });

        // Insert comment (let DB assign created_at automatically)
        const result = await db
            .prepare(`INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)`)
            .bind(postId, user.id, text)
            .run();

        // Return only the new comment ID
        return json({ id: result.meta.last_row_id });
    } catch (err) {
        console.error('Comment error:', err);
        return new Response('Failed to post comment', { status: 500 });
    }
}
