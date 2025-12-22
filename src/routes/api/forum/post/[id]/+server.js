import { json } from '@sveltejs/kit';
import { getAuthenticatedEmail } from '$lib/serverAuth.js';

export async function GET({ request, params, platform }) {
	const email = await getAuthenticatedEmail(request);
	if (!email) return new Response('Unauthorized', { status: 401 });
	
    const db = platform.env.FORUM_D1;
    const { id } = params;

    // Fetch post with username
    const post = await db
        .prepare(`
			SELECT 
				p.id,
				p.title,
				p.body,
				u.username,
				unixepoch(p.created_at) * 1000 AS created_at
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
				unixepoch(c.created_at) * 1000 AS created_at
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
