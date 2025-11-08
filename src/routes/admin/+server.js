import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
    console.log(platform)
    const { title, summary, content, image } = await request.json();
    const r2 = platform.env.BLOG_BUCKET;

    // Generate a random UUID for this article
    const id = crypto.randomUUID();

    const date = new Date().toISOString().split('T')[0];

    // 1️⃣ Save full article
    const article = { id, title, date, content };
    await r2.put(`articles/${id}.json`, JSON.stringify(article, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    // 2️⃣ Update summaries
    const summariesFile = await r2.get('summaries.json');
    const summaries = summariesFile ? await summariesFile.json() : [];

    summaries.unshift({
        id,
        title,
        summary,
        image,
        date
    });

    await r2.put('summaries.json', JSON.stringify(summaries, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ ok: true, id });
}

export const prerender = false;