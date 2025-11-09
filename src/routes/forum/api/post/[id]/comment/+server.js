export async function POST({ request, params, platform }) {
    try {
        const email = request.headers.get('cf-access-authenticated-user-email');
        if (!email) return new Response('Unauthorized', { status: 401 });

        const kv = platform.env.FORUM_KV;
        const bucket = platform.env.BLOG_BUCKET;

        const { id: postId } = params;
        const body = await request.json();
        const text = body?.body?.trim();
        if (!text) return new Response('Empty comment', { status: 400 });

        // Get user ID from KV
        const userKey = `user:${email.toLowerCase()}`;
        const userId = await kv.get(userKey);
        if (!userId) return new Response('User not found', { status: 404 });

        // Fetch user profile from R2
        const profileKey = `forum/users/${userId}.json`;
        const profileObj = await bucket.get(profileKey);
        if (!profileObj) return new Response('User profile not found', { status: 404 });

        const profile = await profileObj.json();
        const username = profile.username;
        if (!username) return new Response('User has no username', { status: 400 });

        // Ensure post exists
        const postKey = `post:${postId}`;
        const postRaw = await kv.get(postKey);
        if (!postRaw) return new Response('Post not found', { status: 404 });

        // Create comment
        const commentId = crypto.randomUUID().replace(/-/g, '');
        const created = new Date().toISOString();

        const comment = {
            id: commentId,
            postId,
            userId,
            username,
            body: text,
            created
        };

        const commentKey = `comment:${postId}:${commentId}`;
        await kv.put(commentKey, JSON.stringify(comment));

        return new Response(JSON.stringify(comment), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Comment error:', err);
        return new Response('Failed to post comment', { status: 500 });
    }
}
