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
	<div class="mb-4 p-4 bg-gradient rounded-3 shadow d-flex justify-content-between align-items-center border border-secondary"
		style="background: linear-gradient(135deg, #1a1a1a, #222);">
		<div>
			<h4 class="mb-0">
				Welcome, <span class="text-info fw-semibold">{forumState.username}</span>!
			</h4>
			<p class="text-secondary mb-0">Check out what’s new in the forum.</p>
		</div>
		<button class="btn btn-info text-dark fw-semibold shadow-sm" on:click={openModal}>
			<i class="bi bi-plus-lg me-1"></i> New Post
		</button>
	</div>

	<!-- Posts List -->
	{#if loading}
		<div class="text-center py-5">
			<div class="spinner-border text-info" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if error}
		<div class="alert alert-danger shadow">{error}</div>
	{:else if posts.length === 0}
		<div class="alert alert-dark text-center py-4 border-secondary shadow-sm">
			No posts yet. Be the first to start a discussion!
		</div>
	{:else}
		<div class="d-flex flex-column gap-3">
			{#each posts as post}
				<a href="/forum/post?id={post.id}" class="text-decoration-none">
					<div class="p-3 rounded-3 shadow-sm border border-secondary bg-dark-subtle text-light
						hover-shadow-sm transition" 
						style="background: linear-gradient(145deg, #2a2a2a, #1f1f1f); transition: all 0.2s ease;">
						<h5 class="mb-1 text-info">{post.title}</h5>
						<small class="text-secondary d-block mb-2">
							Posted by <span class="text-light">{post.username}</span> • {new Date(post.created).toLocaleString()}
						</small>
						<div class="text-end">
							<span class="badge bg-secondary text-light">View Discussion →</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- New Post Modal -->
<div class="modal fade"
	bind:this={modalEl}
	tabindex="-1"
	aria-labelledby="newPostLabel"
	aria-hidden="true"
	data-bs-backdrop="static"
	data-bs-keyboard="false">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content bg-dark text-light border-secondary shadow-lg">
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
							required />
					</div>
					<div class="mb-3">
						<label class="form-label fw-semibold">Body</label>
						<textarea
							bind:value={body}
							class="form-control bg-dark text-light border-secondary"
							rows="4"
							placeholder="What’s on your mind?"
							required></textarea>
					</div>
					{#if postError}
						<div class="alert alert-danger py-2">{postError}</div>
					{/if}
					<div class="d-flex justify-content-end gap-2">
						<button type="button" class="btn btn-outline-secondary" on:click={() => modal.hide()} disabled={posting}>
							Cancel
						</button>
						<button type="submit" class="btn btn-info text-dark fw-semibold" disabled={posting}>
							{#if posting}
								<span class="spinner-border spinner-border-sm me-2"></span> Posting...
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
