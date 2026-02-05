<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let error = '';

	onMount(async () => {
		const articleId = $page.url.searchParams.get('id');

		if (articleId) {
			// Redirect old query param URLs to new dynamic route
			await goto(`/article/${articleId}`);
		} else {
			error = 'No article specified. Please use /article/[id] format.';
		}
	});
</script>

<svelte:head>
	<title>Article - Dalton's Department of Truth</title>
</svelte:head>

<div class="d-flex justify-content-center w-100">
    {#if error}
        <div class="p-5 text-danger text-center">{error}</div>
    {:else}
        <div class="text-center py-5">
            <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Redirecting...</span>
            </div>
        </div>
    {/if}
</div>
