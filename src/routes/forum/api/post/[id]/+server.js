import { json } from '@sveltejs/kit';

export async function GET({ params, platform }) {
    const { id } = params;
    const kv = platform.env.FORUM_KV;

    const postRaw = await kv.get(`post:${id}`);
    if (!postRaw) return new Response('Not found', { status: 404 });

    const post = JSON.parse(postRaw);

    // Later: load comments
    const commentsList = await kv.list({ prefix: `post:${id}:comment:` });
    const comments = [];

    for (const entry of commentsList.keys) {
        const c = await kv.get(entry.name);
        if (c) comments.push(JSON.parse(c));
    }

    comments.sort((a, b) => new Date(a.created) - new Date(b.created));
    post.comments = comments;

    return json(post);
}