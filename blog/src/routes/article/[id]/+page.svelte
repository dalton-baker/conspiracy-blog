<script>
	import { formatDate } from '$lib';
	import { renderMarkdown } from '$lib/markdown';

	export let data;

	$: article = data.article;
	$: error = data.error;
</script>

<svelte:head>
	{#if article}
		<title>{article.title} - Dalton's Department of Truth</title>
		<link rel="preload" as="image" href={article.imageSrc} />
	{/if}
</svelte:head>

<div class="d-flex justify-content-center w-100">
    {#if error}
        <div class="p-5 text-danger text-center">{error}</div>
    {:else if article}
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
