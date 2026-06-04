<script>
	import { onMount } from 'svelte';
	import { forumState } from './state.svelte.js';
	import UsernameModal from './UsernameModal.svelte';
	import AuthModal from './AuthModal.svelte';

	import favicon from '$lib/assets/favicon.svg';
  	import scriptSrc from 'bootstrap/dist/js/bootstrap.bundle.min.js?url';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '$lib/app.css';

	let { children } = $props();
	let showUsernameModal = $state(false);
	let showLoginModal = $state(false);

	// The session lives in an httpOnly cookie sent automatically with each
	// same-origin request, so we just ask the API who we are.
	async function loadUserData() {
		try {
			const res = await fetch('/api', { cache: 'no-store' });

			if (res.status === 401) {
				showLoginModal = true;
				return;
			}
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const authData = await res.json();
			if (!authData || !authData.id) throw new Error('Not authenticated');

			showLoginModal = false;
			forumState.userId = authData.id;
			forumState.username = authData.username;

			if (!forumState.username) {
				showUsernameModal = true;
			}
		} catch (error) {
			console.error('Failed to load user data:', error);
			showLoginModal = true;
		}
	}

	onMount(loadUserData);

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch (err) {
			console.error('Logout failed:', err);
		}
		forumState.userId = null;
		forumState.username = null;
		window.location.assign('https://truth.dalt.dev');
	}
</script>


<svelte:head>
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
	<script src={scriptSrc}></script>
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-dark bg-secondary shadow-sm">
	<div class="container d-flex align-items-center">
		<a class="navbar-brand d-flex align-items-center" href="https://truth.dalt.dev">
			<img src="{favicon}" alt="All-Seeing Eye Logo">
			<span class="fw-semibold">Dalton's Department of Truth</span>
		</a>
		<button class="btn btn-outline-light btn-sm" onclick={handleLogout}>
			Logout
		</button>
	</div>
</nav>

<main class="container my-5 flex-grow-1">
{#if forumState.username}
	{@render children()}
{/if}
</main>

<footer class="bg-secondary text-center text-light py-3 mt-auto">
	<div class="container">
		<p class="mb-0">
			<a href="https://truth.dalt.dev/about" class="text-light text-decoration-none">About</a>
			· <a href="https://daltonsbaker.com" target="_blank" class="text-light text-decoration-none">Contact</a>
			· <a href="https://daltonsbaker.com/privacyPolicy" target="_blank"
				class="text-light text-decoration-none">Disclaimer</a>
		</p>
		<p class="mb-2">© 2025 Dalton's Department of Truth</p>
	</div>
</footer>

<UsernameModal show={showUsernameModal} />
<AuthModal show={showLoginModal} onAuthenticated={loadUserData} />