import { json } from '@sveltejs/kit';

export async function GET({ request, platform }) {
    const email = request.headers.get('cf-access-authenticated-user-email');
    if (!email) return new Response('Unauthorized', { status: 401 });

    const normalizedKey = `user:${email.toLowerCase()}`;
    const kv = platform.env.FORUM_KV;
    const bucket = platform.env.BLOG_BUCKET;

    let id = await kv.get(normalizedKey);
    if (!id) {
        id = crypto.randomUUID();
        await kv.put(normalizedKey, id);
    }

    const key = `forum/users/${id}.json`;
    let profile;
    const object = await bucket.get(key);

    if (object) {
        profile = await object.json();
        profile.lastLogin = new Date().toISOString();
    } else {
        const now = new Date().toISOString();
        profile = {
            id,
            username: null,
            firstLogin: now,
            lastLogin: now
        };
    }

    await bucket.put(key, JSON.stringify(profile), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ id, username: profile.username });
}