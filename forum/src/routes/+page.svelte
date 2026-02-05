<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { forumState } from './state.svelte.js';
	import { Modal } from 'bootstrap';
    import { colorForUser, getRandomColor } from '$lib';
    import { renderMarkdown } from '$lib/markdown'
	import { supabase } from '$lib/supabaseClient.js';

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
	let postPreview = false;

	onMount(async () => {
		await loadPosts();

		modal = new Modal(modalEl, {
			backdrop: 'static',
			keyboard: false
		});
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		forumState.userId = null;
		forumState.username = null;
		goto('/');
	}

	async function loadPosts() {
		loading = true;
		error = '';
		try {
            const { data: { session } } = await supabase.auth.getSession();
			const res = await fetch('/api/post', {
				headers: {
					'Authorization': `Bearer ${session.access_token}`
				}
			});
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

	async function createPost(event) {
		event.preventDefault();
		postError = '';
		posting = true;
		try {
			const { data: { session } } = await supabase.auth.getSession();
			const res = await fetch('/api/post', {
				method: 'POST',
				headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                 },
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
	<div class="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
		<div class="flex-grow-1">
			<h3 class="fw-semibold mb-1">
				Welcome, <span style="color: {colorForUser(forumState.username)}">{forumState.username}</span>
			</h3>
			<p class="text-secondary mb-0">Here’s what’s buzzing on the forum.</p>
		</div>
		<div class="flex-shrink-0 d-flex gap-2 flex-column justify-content-center">
			<button class="btn btn-outline-info fw-semibold w-100 w-sm-auto" onclick={openModal}>
				New Post
			</button>
			<button class="btn btn-outline-light btn-sm" onclick={handleLogout}>
				Logout
			</button>
		</div>
	</div>

	<!-- Posts Section -->
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
		<div class="d-flex flex-column gap-2">
			{#each posts as post, i}
				<div>
					<a href="/forum/post?id={post.id}" class="text-decoration-none text-light">
						<div class="py-3 px-2 border-start border-3 post-hover">
							<h5 class="fw-semibold mb-1">{post.title}</h5>
							<small class="text-secondary d-flex flex-wrap gap-1">
								<span class="fw-semibold text-nowrap" style="color: {colorForUser(post.username)}">
									{post.username}
								</span>
								<span class="text-nowrap">
									• {new Date(post.last_activity_at).toLocaleString()}
								</span>
								<span class="text-nowrap">
									• {post.comment_count} comment{post.comment_count === 1 ? '' : 's'}
								</span>
							</small>
						</div>
					</a>
					<hr class="text-secondary opacity-25 my-0" />
				</div>
			{/each}
		</div>
	{/if}
</div>

<div
	class="modal fade"
	bind:this={modalEl}
	tabindex="-1"
	aria-labelledby="newPostLabel"
	aria-hidden="true"
	data-bs-backdrop="static"
	data-bs-keyboard="false">
	<div class="modal-dialog modal-dialog-centered modal-lg">
		<div class="modal-content bg-dark text-light border-secondary shadow-lg">
			<div class="modal-header border-secondary">
				<h5 class="modal-title" id="newPostLabel">Create New Post</h5>
			</div>

			<div class="modal-body">
				<form onsubmit={createPost}>
					<div class="mb-3">
						<label for="title" class="form-label fw-semibold">Title</label>
						<input
							bind:value={title}
							id="title"
							class="form-control bg-dark text-light border-secondary"
							placeholder="Enter a title"
							required />
					</div>

					<!-- Tabs -->
					<div class="d-flex justify-content-between align-items-center mb-2">
						<label for="body" class="form-label fw-semibold mb-0">Body</label>
						<button
							type="button"
							class="btn btn-sm"
							class:btn-outline-info={!postPreview}
							class:btn-info={postPreview}
							onclick={() => (postPreview = !postPreview)}>
							Preview
						</button>
					</div>

					<!-- Tab content -->
					{#if postPreview}
						<div class="markup-content" style="min-height: 8rem;">
							{@html renderMarkdown(body || '*Nothing to preview yet...*')}
						</div>
					{:else}
						<div class="mb-3">
							<textarea
								bind:value={body}
								id="body"
								class="form-control bg-dark text-light border-secondary"
								rows="6"
								placeholder="Write your post using GitHub Markdown..."
								required></textarea>
							<small class="text-secondary">
								Supports <a href="https://guides.github.com/features/mastering-markdown/" target="_blank" rel="noopener noreferrer" class="link-info">GitHub Markdown</a>.
							</small>
						</div>
					{/if}

					{#if postError}
						<div class="alert alert-danger py-2 mt-3">{postError}</div>
					{/if}

					<div class="d-flex justify-content-end gap-2 mt-3">
						<button
							type="button"
							class="btn btn-outline-secondary"
							onclick={() => modal.hide()}
							disabled={posting}>
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

<style>
	.post-hover {
		transition: all 0.15s ease-in-out;
	}
	.post-hover:hover {
		background: rgba(255, 255, 255, 0.03);
		border-left-color: var(--bs-info);
		transform: translateX(3px);
	}
</style>