<script>
    import { onMount } from 'svelte';
	import { goto } from '$app/navigation'
	
	let { children } = $props();
    const maxReloadCount = 1;
    let authenticated = $state(false);

    onMount(async () => {
		const reloadCount = parseInt(sessionStorage.getItem('authReloadCount') || '0', 10);

		try {
			const res = await fetch('/admin/api', { cache: 'no-store' });

			// If it failed outright or returned bad JSON, bail early
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const authData = await res.json();
            
            authenticated = authData.authenticate;
			if (!authData.authenticate) throw new Error('Not authenticated');

			// Logged in successfully, clear reload count
			sessionStorage.removeItem('authReloadCount');
		} catch (error) {
			console.warn('Auth check failed:', error);

			if (reloadCount < maxReloadCount) {
				sessionStorage.setItem('authReloadCount', reloadCount + 1);
				window.location.reload();
			} else {
				sessionStorage.removeItem('authReloadCount');
				goto('/');
			}
		}
	});
</script>

{#if authenticated}
    {@render children()}
{/if}