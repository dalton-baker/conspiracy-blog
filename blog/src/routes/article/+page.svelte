<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(async () => {
		const articleId = $page.url.searchParams.get('id');

		if (articleId) {
			// Redirect old query param URLs to new dynamic route
			await goto(`/article/${articleId}`);
		} else {
			await goto(`/article`);
		}
	});
</script>
