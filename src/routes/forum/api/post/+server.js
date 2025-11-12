import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
    const db = platform.env.FORUM_D1;

    // grab all posts joined to their user names, newest first
    const result = await db
        .prepare(`
			SELECT 
				p.id,
				p.title,
				u.username,
				p.created_at
			FROM posts AS p
			LEFT JOIN users AS u ON p.user_id = u.id
			ORDER BY p.created_at DESC
		`)
        .all();

    // result.results holds rows when using .all()
    return json(result.results ?? []);
}

export async function POST({ request, platform }) {
    const email = request.headers.get('cf-access-authenticated-user-email');
    if (!email) return new Response('Unauthorized', { status: 401 });

    const kv = platform.env.FORUM_KV;
    const bucket = platform.env.BLOG_BUCKET; // optional if you need profiles
    const body = await request.json();

    const title = body.title?.trim();
    const content = body.body?.trim();

    if (!title || !content)
        return new Response('Missing title or body', { status: 400 });

    // Look up user ID from email
    const userKey = `user:${email.toLowerCase()}`;
    const authorId = await kv.get(userKey);
    if (!authorId) return new Response('User not found', { status: 404 });

    // Load user profile to grab username
    const profileObj = await bucket.get(`forum/users/${authorId}.json`);
    const profile = profileObj ? await profileObj.json() : null;
    const username = profile?.username || 'Unknown';

    const id = crypto.randomUUID().replace(/-/g, '');
    const created = new Date().toISOString();

    const post = {
        id,
        title,
        body: content,
        authorId,
        username,
        created
    };

    await kv.put(`post:${id}`, JSON.stringify(post));

    return json(post);
}