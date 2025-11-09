<script>
	import { onMount } from 'svelte';
	import { Modal } from 'bootstrap';
	import { goto } from '$app/navigation';
	import { forumState } from './state.svelte.js';

	let { children } = $props();
	const maxReloadCount = 1;
	let authenticated = $state(false);
	let profile = $state(null);
	let modalEl = $state(null);

	let username = $state('');
	let message = $state('');
	let error = $state('');
	let saving = $state(false);

	onMount(async () => {
		const reloadCount = parseInt(sessionStorage.getItem('authReloadCount') || '0', 10);

		try {
			const res = await fetch('/forum/api', { cache: 'no-store' });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const authData = await res.json();
			console.log('authData', authData);

			if (!authData || !authData.id) throw new Error('Not authenticated');

			profile = authData;
			forumState.userId = authData.id;
			forumState.username = authData.username;

			if (!forumState.username) {
				new Modal(modalEl, {
					backdrop: 'static',
					keyboard: false
				}).show();
			}

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

	async function saveUsername() {
		try {
			const res = await fetch('/forum/api', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username })
			});

			const text = await res.text();
			let data;

			try {
				data = JSON.parse(text);
			} catch {
				// not JSON, use text directly
				data = { message: text };
			}

			if (!res.ok) {
				error = data?.message || text || `Error ${res.status}`;
				return;
			}

			// success
			forumState.username = data.username;
			Modal.getInstance(modalEl).hide();
			message = `Welcome, ${data.username}!`;
			setTimeout(() => Modal.getInstance(modalEl).hide(), 1000);
		} catch (err) {
			error = err.message || 'Error saving username';
		} finally {
			saving = false;
		}
	}
</script>

{#if forumState.username}
	{@render children()}
{:else}
<div
	class="modal fade"
	bind:this={modalEl}
	tabindex="-1"
	aria-hidden="true"
	data-bs-backdrop="static"
	data-bs-keyboard="false"
>
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content bg-dark text-light border-light shadow-lg">
			<div class="modal-header border-secondary">
				<h5 class="modal-title" id="usernameModalLabel">Choose a Username</h5>
			</div>
			<div class="modal-body">
				<p class="text-secondary mb-3">
					You need to set a username before posting or replying.
				</p>

				<form onsubmit="{saveUsername}">
					<div class="mb-3">
						<input
							bind:value={username}
							class="form-control bg-dark text-light border-secondary"
							placeholder="Enter a username"
							minlength="3"
							maxlength="30"
							required
						/>
					</div>

					{#if message}
						<div class="alert alert-success py-2">{message}</div>
					{/if}

					{#if error}
						<div class="alert alert-danger py-2">{error}</div>
					{/if}

					<button class="btn btn-primary w-100" disabled={saving}>
						{#if saving}
							<span class="spinner-border spinner-border-sm me-2"></span>
							Saving...
						{:else}
							Save
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
{/if}