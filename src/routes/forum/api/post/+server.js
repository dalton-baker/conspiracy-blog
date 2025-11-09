import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
    const kv = platform.env.FORUM_KV;
    const list = await kv.list({ prefix: 'post:' });

    const posts = [];

    for (const entry of list.keys) {
        const raw = await kv.get(entry.name);
        if (!raw) continue;
        const post = JSON.parse(raw);
        posts.push(post);
    }

    // sort newest first
    posts.sort((a, b) => new Date(b.created) - new Date(a.created));

    return json(posts);
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