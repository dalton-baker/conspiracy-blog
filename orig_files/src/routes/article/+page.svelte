<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { formatDate } from '$lib';
	import { renderMarkdown } from '$lib/markdown';

	let article = null;
	let error = '';
	let loading = true;
	let articleId = null;

	onMount(async () => {
		articleId = $page.url.searchParams.get('id');
		const baseUrl = 'https://truth-data.dalt.dev/articles';

		if (!articleId) {
			error = 'No article specified.';
			loading = false;
			return;
		}

		try {
			const res = await fetch(`${baseUrl}/${articleId}.json`);
			if (!res.ok) {
				error = 'Failed to load article.';
			} else {
				article = await res.json();
				article.imageSrc = `https://truth-data.dalt.dev/images/${articleId}.webp`;
				if (article.lastUpdated) article.imageSrc += `?v=${article.lastUpdated}`;
			}
		} catch (err) {
			console.error(err);
			error = 'Failed to load article.';
		} finally {
			loading = false;
		}
	});
</script>
<div class="d-flex justify-content-center w-100">
    {#if loading}
        <div class="text-center py-5">
            <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    {:else if error}
        <div class="p-5 text-danger text-center">{error}</div>
    {:else}
        <div class="card article bg-secondary text-light border-light shadow-sm">
            <img src="{article.imageSrc}" class="card-img-top article" alt="{article.title} image">
            <div class="card-img-overlay">
                <h2 class="card-title">{article.title}</h2>
                <p class="mb-0 text-warning">{formatDate(article.date)}</p>
            </div>
            <article class="card-body markup-content">
                {@html renderMarkdown(article.content)}
            </article>
        </div>
    {/if}
</div>