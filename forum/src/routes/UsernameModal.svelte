<script>
	import { onMount, onDestroy } from 'svelte';
	import { Modal } from 'bootstrap';
	import { forumState } from './state.svelte.js';

	let { show = false } = $props();

	let modalEl = $state(null);
	let modalInstance = $state(null);

	let username = $state('');
	let message = $state('');
	let error = $state('');
	let saving = $state(false);

	onMount(() => {
		modalInstance = new Modal(modalEl, {
			backdrop: 'static',
			keyboard: false
		});
	});

	onDestroy(() => {
		modalInstance.hide();
	});

    $effect(() => {
        if (show) {
			modalInstance.show();
		}
        else {
            modalInstance.hide();
        }
    });

	async function saveUsername() {
		saving = true;
		error = '';
		message = '';

		try {
			const res = await fetch('/api', {
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
			message = `Welcome, ${data.username}!`;
			setTimeout(() => show = false, 500);
		} catch (err) {
			error = err.message || 'Error saving username';
		} finally {
			saving = false;
		}
	}
</script>

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

				<form onsubmit={saveUsername}>
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
