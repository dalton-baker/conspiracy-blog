<script>
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
</script>


<svelte:head>
	<link rel="icon" href={favicon} />
	<style>
		.navbar-brand img {
			height: 32px;
			width: auto;
			filter: invert(1) brightness(1.2);
			margin-right: 10px;
		}
		
		.card-img-top {
			object-fit: cover;
			height: 200px;
		}
	</style>
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-dark bg-secondary shadow-sm">
	<div class="container d-flex align-items-center">
		<a class="navbar-brand d-flex align-items-center" href="/">
			<img src="{favicon}" alt="All-Seeing Eye Logo">
			<span class="fw-semibold">Dalton’s Department of Truth</span>
		</a>
		<div class="ms-auto">
			<a href="/" class="btn btn-outline-light btn-sm">Home</a>
		</div>
	</div>
</nav>

<main class="container my-5 flex-grow-1">
	{@render children()}
</main>

<footer class="bg-secondary text-center text-light py-3 mt-auto">
	<div class="container">
		<p class="mb-2">© 2025 Dalton’s Department of Truth — All rights reserved.</p>
		<p class="mb-0">
			<a href="/about" class="text-light text-decoration-none">About</a>
			· <a href="https://daltonsbaker.com" target="_blank" class="text-light text-decoration-none">Contact</a>
			· <a href="https://daltonsbaker.com/privacyPolicy" target="_blank"
				class="text-light text-decoration-none">Disclaimer</a>
		</p>
	</div>
</footer>
