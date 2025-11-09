<script>
    import { onMount } from 'svelte';
	let { children } = $props();
    const maxReloadCount = 1;
    let authenticated = $state(false);

    onMount(async () => {
		const reloadCount = parseInt(sessionStorage.getItem('authReloadCount') || '0', 10);

		try {
			const res = await fetch('/forum/api', { cache: 'no-store' });

			// If it failed outright or returned bad JSON, bail early
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const authData = await res.json();
            
			console.log(authData);

            id = authData.id;
			if (!id) throw new Error('Not authenticated');

			// Logged in successfully, clear reload count
			sessionStorage.removeItem('authReloadCount');
		} catch (error) {
			console.warn('Auth check failed:', error);

			if (reloadCount < maxReloadCount) {
				sessionStorage.setItem('authReloadCount', reloadCount + 1);
				window.location.reload();
			} else {
				sessionStorage.removeItem('authReloadCount');
				window.location.href = '/'; // boot them home
			}
		}
	});
</script>

{#if authenticated}
    {@render children()}
{/if}