<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { convertToWebP } from '$lib'

    let post = { id: '', title: '', summary: '', content: '', date: '' };
    let imageFile = null;
    let imagePreview = '';
    let status = '';
    let loading = true;

    onMount(async () => {
        try {
            const articleId = $page.url.searchParams.get('id');
            if (!articleId) throw new Error('Missing article ID.');
        // Load main article
        const articleRes = await fetch(`https://truth-data.dalt.dev/articles/${articleId}.json`);
        if (!articleRes.ok) throw new Error('Failed to load article.');
        const article = await articleRes.json();

        // Load summary
        const summariesRes = await fetch('https://truth-data.dalt.dev/summaries.json');
        const summaries = summariesRes.ok ? await summariesRes.json() : [];
        const match = summaries.find(a => a.id === articleId);

        post = {
            id: articleId,
            title: article.title,
            summary: match?.summary ?? '',
            content: article.content,
            date: article.date
        };

        // Display current header image
        imagePreview = `https://truth-data.dalt.dev/images/${articleId}.webp`;
        } catch (err) {
            console.error(err);
            status = '❌ Failed to load article data.';
        } finally {
            loading = false;
        }
    });

    async function handleImageChange(e) {
        const original = e.target.files?.[0];
        if (!original) return;

        // Convert to webp
        const converted = await convertToWebP(original);
        imageFile = converted;
        imagePreview = URL.createObjectURL(converted);
    }

    async function submit() {
        try {
        status = '⏳ Saving changes...';

        const form = new FormData();
        form.append('id', post.id);
        form.append('title', post.title);
        form.append('summary', post.summary);
        form.append('content', post.content);
        if (imageFile) form.append('image', imageFile); // Only if replaced

        const res = await fetch('/admin/article-api', {
            method: 'PUT',
            body: form
        });

        if (!res.ok) throw new Error(await res.text());
            status = '✅ Saved!';
            await new Promise(r => setTimeout(r, 1000));
            goto('/admin');
        } catch (err) {
            console.error(err);
            status = `❌ ${err.message}`;
        }
    }
</script>

{#if loading}
  <div class="p-5 text-center text-secondary">Loading article...</div>
{:else}
  <div class="container bg-dark text-light p-4 rounded mt-5" style="max-width: 800px;">
    <h1 class="mb-4 border-bottom pb-2">✏️ Edit Article</h1>

    <div class="mb-3">
      <label for="title" class="form-label">Title</label>
      <input id="title" class="form-control bg-secondary text-light border-0" bind:value={post.title} />
    </div>

    <div class="mb-3">
      <label for="summary" class="form-label">Summary</label>
      <textarea id="summary" class="form-control bg-secondary text-light border-0" rows="2" bind:value={post.summary}></textarea>
    </div>

    <div class="mb-3">
      <label for="image" class="form-label">Header Image</label>
      <input
        id="image"
        type="file"
        accept="image/*"
        class="form-control bg-secondary text-light border-0"
        on:change={handleImageChange}
      />
      {#if imagePreview}
        <div class="mt-3 text-center">
          <img
            src={imagePreview}
            alt="Preview"
            class="img-fluid rounded border border-light"
            style="max-height: 200px;"
          />
        </div>
      {/if}
    </div>

    <div class="mb-3">
      <label for="content" class="form-label">Content (HTML supported)</label>
      <textarea id="content" class="form-control bg-secondary text-light border-0" rows="10" bind:value={post.content}></textarea>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-4">
      <button class="btn btn-warning px-4" on:click={submit}>Save Changes</button>
      <p class="m-0">{status}</p>
    </div>

    <div class="bg-secondary p-3 rounded">
      <h5 class="border-bottom pb-2 mb-3">Live Preview</h5>
      <div class="bg-dark p-3 rounded" style="min-height: 100px;">
        {@html post.content}
      </div>
    </div>
  </div>
{/if}
