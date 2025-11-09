<script>
	import { onMount } from 'svelte';
	import { forumState } from './state.svelte.js';
	import { Modal } from 'bootstrap';

	let posts = [];
	let loading = true;
	let error = '';

	// Modal state
	let modalEl;
	let modal;
	let title = '';
	let body = '';
	let posting = false;
	let postError = '';

	onMount(async () => {
		await loadPosts();

		modal = new Modal(modalEl, {
			backdrop: 'static',
			keyboard: false
		});
	});

	async function loadPosts() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/forum/api/post');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			posts = await res.json();
		} catch (err) {
			console.error(err);
			error = 'Failed to load posts.';
		} finally {
			loading = false;
		}
	}

	function openModal() {
		title = '';
		body = '';
		postError = '';
		modal.show();
	}

	async function createPost() {
		postError = '';
		posting = true;
		try {
			const res = await fetch('/forum/api/post', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, body })
			});

			const text = await res.text();
			let data;
			try {
				data = JSON.parse(text);
			} catch {
				data = { message: text };
			}

			if (!res.ok) {
				postError = data.message || `Error ${res.status}`;
				return;
			}

			// success: hide modal and refresh posts
			modal.hide();
			await loadPosts();
		} catch (err) {
			postError = err.message || 'Error creating post.';
		} finally {
			posting = false;
		}
	}
</script>

<div class="container py-4 text-light">
	<!-- Welcome Banner -->
	<div class="mb-4 p-3 bg-dark border border-secondary rounded-3 shadow-sm d-flex justify-content-between align-items-center">
		<div>
			<h4 class="mb-0">
				Welcome, <span class="text-primary fw-semibold">{forumState.username}</span>!
			</h4>
			<p class="text-secondary mb-0">Check out what’s new in the forum.</p>
		</div>
		<button class="btn btn-primary" on:click={openModal}>
			<i class="bi bi-plus-lg me-1"></i> New Post
		</button>
	</div>

	<!-- Posts List -->
	{#if loading}
		<div class="text-center py-5">
			<div class="spinner-border text-light" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if error}
		<div class="alert alert-danger">{error}</div>
	{:else if posts.length === 0}
		<div class="alert alert-secondary text-center py-3">
			No posts yet. Be the first to start a discussion!
		</div>
	{:else}
		<ul class="list-group list-group-flush">
			{#each posts as post}
				<li class="list-group-item bg-dark text-light border-secondary rounded-2 mb-2 shadow-sm">
					<h5 class="mb-1">{post.title}</h5>
					<small class="text-secondary">
						Posted by <span class="text-info">{post.username}</span> on
						{new Date(post.created).toLocaleString()}
					</small>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- New Post Modal -->
<div
	class="modal fade"
	bind:this={modalEl}
	tabindex="-1"
	aria-labelledby="newPostLabel"
	aria-hidden="true"
	data-bs-backdrop="static"
	data-bs-keyboard="false"
>
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content bg-dark text-light border-light shadow-lg">
			<div class="modal-header border-secondary">
				<h5 class="modal-title" id="newPostLabel">Create New Post</h5>
			</div>
			<div class="modal-body">
				<form on:submit|preventDefault={createPost}>
					<div class="mb-3">
						<label class="form-label fw-semibold">Title</label>
						<input
							bind:value={title}
							class="form-control bg-dark text-light border-secondary"
							placeholder="Enter a title"
							required
						/>
					</div>
					<div class="mb-3">
						<label class="form-label fw-semibold">Body</label>
						<textarea
							bind:value={body}
							class="form-control bg-dark text-light border-secondary"
							rows="4"
							placeholder="What’s on your mind?"
							required
						></textarea>
					</div>
					{#if postError}
						<div class="alert alert-danger py-2">{postError}</div>
					{/if}
					<div class="d-flex justify-content-end gap-2">
						<button
							type="button"
							class="btn btn-outline-secondary"
							on:click={() => modal.hide()}
							disabled={posting}
						>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary" disabled={posting}>
							{#if posting}
								<span class="spinner-border spinner-border-sm me-2"></span>
								Posting...
							{:else}
								Post
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
