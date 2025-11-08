<script>
    import { onMount } from 'svelte';
    import { formatDate } from '$lib';

    let error = '';
    let loading = true;
    let articles = null;

    onMount(async () => {
        try {
            const res = await fetch('https://truth-data.dalt.dev/summaries.json');
            if (!res.ok){
                error = 'Failed to load articles.';
            }else{
                articles = await res.json();
                articles.sort((a, b) => b.date.localeCompare(a.date));
            }
        } catch (err) {
            console.error(err);
            error = 'Failed to load article.';
        } finally {
            loading = false;
        }
    });
</script>

<h1 class="mb-5 text-center display-5 fw-bold">Wake Up Sheeple</h1>

{#if loading}
    <div class="p-5 text-center text-secondary">Loading...</div>
{:else if error}
    <div class="p-5 text-danger text-center">{error}</div>
{:else}
    <div class="row g-4">
        {#each articles as article}
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 bg-secondary text-light border-light shadow-sm">
                    <img src="https://truth-data.dalt.dev/images/{article.id}.webp" class="card-img-top"
                        alt="The Moon is Actually Rental Property">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">{article.title}</h5>
                        <p class="card-text flex-grow-1">{article.summary}</p>
                        <div class="mt-3">
                            <small class="text-warning">{formatDate(article.date)}</small><br>
                            <a href="{`article?id=${article.id}`}" class="btn btn-outline-light btn-sm mt-2 stretched-link">Read More</a>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}