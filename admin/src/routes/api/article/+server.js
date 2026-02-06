import { json } from '@sveltejs/kit';

function getMountainDate() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    // en-CA gives ISO-style "YYYY-MM-DD" parts automatically
    return formatter.format(now);
}

function getEpochMinutes() {
    // milliseconds → seconds → round to nearest minute
    return Math.floor(Date.now() / 60000);
}

export async function POST({ request, platform }) {
    const form = await request.formData();

    // Extract fields
    const title = form.get('title')?.toString() || '';
    const summary = form.get('summary')?.toString() || '';
    const content = form.get('content')?.toString() || '';
    const image = form.get('image'); // <== the File object

    const r2 = platform.env.BLOG_BUCKET;
    const id = crypto.randomUUID().replace(/-/g, '');
    const date = getMountainDate();

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

export async function PUT({ request, platform }) {
    const form = await request.formData();
    const r2 = platform.env.BLOG_BUCKET;

    const id = form.get('id')?.toString();
    if (!id) return new Response('Missing id', { status: 400 });

    const title = form.get('title')?.toString() ?? '';
    const summary = form.get('summary')?.toString() ?? '';
    const content = form.get('content')?.toString() ?? '';
    const image = form.get('image');
    const lastUpdated = getEpochMinutes();

    // Pull summaries list
    const summariesFile = await r2.get('summaries.json');
    const summaries = summariesFile ? await summariesFile.json() : [];

    console.log(summaries);
    console.log(id);
    const existingIndex = summaries.findIndex(s => s.id === id);
    if (existingIndex === -1)
        return new Response('Article not found in summaries', { status: 404 });

    const date = summaries[existingIndex].date ?? new Date().toISOString().split('T')[0];

    // Replace image if new one provided
    if (image instanceof File && image.size > 0) {
        if (image.type !== 'image/webp')
            return new Response('Only WebP images are allowed', { status: 400 });

        await r2.put(`images/${id}.webp`, await image.arrayBuffer(), {
            httpMetadata: { contentType: 'image/webp' }
        });
    }

    // Update article JSON
    const updatedArticle = { title, date, lastUpdated, content };
    await r2.put(`articles/${id}.json`, JSON.stringify(updatedArticle, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    // Update summary entry
    summaries[existingIndex] = { id, title, summary, date, lastUpdated };
    await r2.put('summaries.json', JSON.stringify(summaries, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ ok: true, id });
}

export async function DELETE({ url, platform }) {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });

    const r2 = platform.env.BLOG_BUCKET;

    // Delete image and article if they exist
    await r2.delete(`articles/${id}.json`);
    await r2.delete(`images/${id}.webp`);

    // Remove from summaries
    const summariesFile = await r2.get('summaries.json');
    const summaries = summariesFile ? await summariesFile.json() : [];
    const updated = summaries.filter(a => a.id !== id);

    await r2.put('summaries.json', JSON.stringify(updated, null, 2), {
        httpMetadata: { contentType: 'application/json' }
    });

    return json({ ok: true });
}