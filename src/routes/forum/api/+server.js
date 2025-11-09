import { json } from '@sveltejs/kit';

export async function GET({ request, platform }) {
    //return json({ id: crypto.randomUUID().replace(/-/g, ''), username: null });
    const email = request.headers.get('cf-access-authenticated-user-email');
    if (!email) return new Response('Unauthorized', { status: 401 });

    const normalizedKey = `user:${email.toLowerCase()}`;
    const kv = platform.env.FORUM_KV;
    const bucket = platform.env.BLOG_BUCKET;

    let id = await kv.get(normalizedKey);
    if (!id) {
        id = crypto.randomUUID().replace(/-/g, '');
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

export async function POST({ request, platform }) {
    //return json({ id: crypto.randomUUID().replace(/-/g, ''), username: "Dalton" });
    const email = request.headers.get('cf-access-authenticated-user-email');
    if (!email) return new Response('Unauthorized', { status: 401 });

    const kv = platform.env.FORUM_KV;
    const bucket = platform.env.BLOG_BUCKET;

    const normalizedKey = `user:${email.toLowerCase()}`;
    const id = await kv.get(normalizedKey);
    if (!id) return new Response('User not found', { status: 404 });

    const { username } = await request.json();
    if (!username || username.trim().length < 3 || username.trim().length > 30) {
        return new Response('Username must be 3–30 characters long', { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return new Response('Only letters, numbers, and underscores allowed', { status: 400 });
    }

    const clean = username.trim();
    const cleanLower = clean.toLowerCase();
    const usernameKey = `username:${cleanLower}`;

    // Grab user's existing profile
    const userKey = `forum/users/${id}.json`;
    const object = await bucket.get(userKey);
    if (!object) return new Response('Profile not found', { status: 404 });

    const profile = await object.json();

    // If they already have a username, block the request
    if (profile.username) {
        return new Response('Username already set and cannot be changed', { status: 403 });
    }

    // Check if this username is already taken
    const existing = await kv.get(usernameKey);
    if (existing) {
        return new Response('Username already taken', { status: 409 });
    }

    // Attempt to claim username
    await kv.put(usernameKey, id);

    // Verify claim (simple optimistic lock)
    const verify = await kv.get(usernameKey);
    if (verify !== id) {
        return new Response('Username already taken', { status: 409 });
    }

    // Update profile in R2
    profile.username = clean;
    await bucket.put(userKey, JSON.stringify(profile), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ id, username: clean });
}