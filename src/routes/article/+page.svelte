<svelte:head>
	<style>
		.article-hero {
            position: relative;
            height: 300px;
            overflow: hidden;
            border-radius: .5rem;
        }

        .article-hero img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: brightness(0.6);
        }

        .article-hero .overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 2rem;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
        }

        article {
            background: #f8f9fa;
            color: #212529;
            border-radius: .5rem;
            padding: 2rem;
            margin-top: -2rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.3);
        }
	</style>
</svelte:head>

<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { formatDate } from '$lib';
    import { renderMarkdown } from '$lib/markdown'

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
            if (!res.ok){
                error = 'Failed to load article.';
            }else{
                article = await res.json();

                article.imageSrc = `https://truth-data.dalt.dev/images/${articleId}.webp`
                if(article.lastUpdated) article.imageSrc += `?v=${article.lastUpdated}`
            }
        } catch (err) {
            console.error(err);
            error = 'Failed to load article.';
        } finally {
            loading = false;
        }
    });
</script>


{#if loading}
    <div class="p-5 text-center text-secondary">Loading...</div>
{:else if error}
    <div class="p-5 text-danger text-center">{error}</div>
{:else}
    <div class="container my-4">
        <div class="article-hero">
            <img src="{article.imageSrc}" alt="Elite Lookiong at moon model">
            <div class="overlay text-light">
                <h2 class="fw-bold">{article.title}</h2>
                <p class="mb-0">{formatDate(article.date)}</p>
            </div>
        </div>
    </div>
    <div class="container mb-5">
        <article class="py-4">
            {@html renderMarkdown(article.content)}
        </article>
    </div>
{/if}

