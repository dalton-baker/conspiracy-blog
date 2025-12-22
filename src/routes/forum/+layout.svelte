<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { forumState } from './state.svelte.js';
	import { supabase } from '$lib/supabaseClient.js';
	import UsernameModal from './UsernameModal.svelte';
	import AuthModal from './AuthModal.svelte';

	let { children, data } = $props();
	let showUsernameModal = $state(false);
	let showLoginModal = $state(false);
	let authSession = $state(null);

	async function loadUserData() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			authSession = session;

			const res = await fetch('/api/forum', { 
				cache: 'no-store',
				headers: {
					'Authorization': `Bearer ${session.access_token}`
				}
			});
			
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}

			const authData = await res.json();
			if (!authData || !authData.id) throw new Error('Not authenticated');

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

	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();
		console.log('Current session on mount:', session);

		if (!session) {
			showLoginModal = true;
		}
		else {
			await loadUserData();
		}
	});
</script>

{#if forumState.username}
	{@render children()}
{/if}

<UsernameModal show={showUsernameModal} />
<AuthModal show={showLoginModal} onAuthenticated={loadUserData} />