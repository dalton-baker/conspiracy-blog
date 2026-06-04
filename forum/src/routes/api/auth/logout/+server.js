import { json } from '@sveltejs/kit';
import { destroySession, SESSION_COOKIE } from '$lib/serverAuth.js';

export async function POST({ platform, cookies }) {
    const token = cookies.get(SESSION_COOKIE);

    if (token) {
        await destroySession(platform.env.FORUM_D1, platform.env, token);
    }

    cookies.delete(SESSION_COOKIE, { path: '/' });
    return json({ ok: true });
}
