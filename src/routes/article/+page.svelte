<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let article = null;
  let error = '';
  let loading = true;

  onMount(async () => {
    const id = $page.url.searchParams.get('id');
    const baseUrl = 'https://truth-data.dalt.dev/articles';

    if (!id) {
      error = 'No article specified.';
      loading = false;
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/${id}.json`);
      if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);
      article = await res.json();
    } catch (err) {
      console.error(err);
      error = 'Failed to load article.';
    } finally {
      loading = false;
    }
  });
</script>

<div class="container my-4 text-light bg-dark p-0 rounded overflow-hidden">
  {#if loading}
    <div class="p-5 text-center text-secondary">Loading...</div>
  {:else if error}
    <div class="p-5 text-danger text-center">{error}</div>
  {:else}
    <div class="article-hero position-relative">
      {#if article.image}
        <img src={article.image} alt={article.title} class="w-100" style="max-height: 400px; object-fit: cover;" />
      {/if}
      <div class="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 p-3">
        <h2 class="fw-bold">{article.title}</h2>
        <p class="mb-0 text-secondary">{article.date}</p>
      </div>
    </div>

    <article class="p-4">
      {@html article.content}
    </article>
  {/if}
</div>
