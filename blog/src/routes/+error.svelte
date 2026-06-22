<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Nothing to see here - Dalton's Department of Truth</title>
</svelte:head>

<div class="text-center py-5">
	<h1 class="display-5 fw-bold">{$page.status}</h1>
	<p class="lead text-warning">{$page.error?.message ?? 'This truth has been redacted.'}</p>
	<a href="/" class="btn btn-outline-light mt-3">Return to safety</a>
</div>
