import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
    const form = await request.formData();

    // Extract fields
    const title = form.get('title')?.toString() || '';
    const summary = form.get('summary')?.toString() || '';
    const content = form.get('content')?.toString() || '';
    const image = form.get('image'); // <== the File object

    const r2 = platform.env.BLOG_BUCKET;
    const id = crypto.randomUUID().replace(/-/g, '');
    const date = new Date().toISOString().split('T')[0];

    // Handle image upload (WebP only)
    if (image instanceof File) {
        if (image.type !== 'image/webp') {
            return new Response('Only WebP images are allowed', { status: 400 });
        }

        const key = `images/${id}.webp`;

        await r2.put(key, await image.arrayBuffer(), {
            httpMetadata: { contentType: 'image/webp' }
        });
    }

    // Create article object
    const article = { title, date, content };

    // Save full article
    await r2.put(`articles/${id}.json`, JSON.stringify(article, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    // Update summaries
    const summariesFile = await r2.get('summaries.json');
    const summaries = summariesFile ? await summariesFile.json() : [];

    summaries.unshift({ id, title, summary, date });

    await r2.put('summaries.json', JSON.stringify(summaries, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ ok: true, id });
}
