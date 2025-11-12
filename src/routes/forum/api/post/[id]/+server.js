import { json } from '@sveltejs/kit';

export async function GET({ params, platform }) {
    const db = platform.env.FORUM_DB;
    const { id } = params;

    // Fetch post with username
    const post = await db
        .prepare(`
			SELECT 
				p.id,
				p.title,
				p.body,
				u.username,
				p.created_at
			FROM posts AS p
			LEFT JOIN users AS u ON p.user_id = u.id
			WHERE p.id = ?
		`)
        .bind(id)
        .first();

    if (!post) return new Response('Not found', { status: 404 });

    // Fetch comments joined to usernames
    const commentResults = await db
        .prepare(`
			SELECT 
				c.id,
				c.body,
				u.username,
				c.created_at
			FROM comments AS c
			LEFT JOIN users AS u ON c.user_id = u.id
			WHERE c.post_id = ?
			ORDER BY c.created_at ASC
		`)
        .bind(id)
        .all();

    post.comments = commentResults.results ?? [];

    return json(post);
}
