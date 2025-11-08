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
    let imageUrl = '';

    // Optional: handle image upload if present
    if (image instanceof File) {
        if (!image.type.startsWith('image/')) {
            return new Response('Invalid image type', { status: 400 });
        }

        const ext = image.type.split('/').pop() || 'bin';
        const key = `images/${id}.${ext}`;

        await r2.put(key, await image.arrayBuffer(), {
            httpMetadata: { contentType: image.type }
        });

        imageUrl = `https://truth-data.dalt.dev/${key}`;
    }

    // Create article object
    const article = { id, title, date, content, image: imageUrl };

    // Save full article
    await r2.put(`articles/${id}.json`, JSON.stringify(article, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    // Update summaries
    const summariesFile = await r2.get('summaries.json');
    const summaries = summariesFile ? await summariesFile.json() : [];

    summaries.unshift({ id, title, summary, image: imageUrl, date });

    await r2.put('summaries.json', JSON.stringify(summaries, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ ok: true, id, image: imageUrl });
}
