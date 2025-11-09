<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let post = null;
    let error = '';
    let loading = true;
    let postId = null;

    let commentText = '';
	let submitting = false;
	let commentError = '';

    onMount(async () => {
        postId = $page.url.searchParams.get('id');

        if (!postId) {
            error = 'No post specified.';
            loading = false;
            return;
        }

        try {
            const res = await fetch(`/forum/api/post/${postId}`);
            if (!res.ok){
                error = 'Failed to load post.';
            }else{
                post = await res.json();
            }
        } catch (err) {
            console.error(err);
            error = 'Failed to load article.';
        } finally {
            loading = false;
        }
    });

    async function submitComment() {
		commentError = '';
		submitting = true;
		try {
			const res = await fetch(`/forum/api/post/${postId}/comment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body: commentText })
			});

			if (!res.ok) throw new Error(await res.text());
			const newComment = await res.json();

			// Add to comment list and reset
			post.comments = [...(post.comments || []), newComment];
			commentText = '';
		} catch (err) {
			console.error(err);
			commentError = err.message || 'Failed to post comment.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="container py-4 text-light">
	{#if loading}
		<div class="text-center py-5">
			<div class="spinner-border text-light" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if error}
		<div class="alert alert-danger">{error}</div>
	{:else if post}
		<!-- Post Card -->
		<div class="bg-dark border border-secondary rounded-3 shadow-sm p-4 mb-4">
			<h3 class="text-primary mb-3">{post.title}</h3>
			<p class="text-secondary mb-2">
				Posted by <span class="text-info">{post.username}</span>
				<small class="ms-2">{new Date(post.created).toLocaleString()}</small>
			</p>
			<hr class="border-secondary" />
			<p class="fs-5">{post.body}</p>
		</div>

		<!-- Comments Section -->
		<div class="mb-4">
			<h5 class="mb-3">Comments</h5>
			{#if post.comments && post.comments.length > 0}
				<ul class="list-group list-group-flush">
					{#each post.comments as comment}
						<li class="list-group-item bg-dark text-light border-secondary rounded-2 mb-2 shadow-sm">
							<p class="mb-1">{comment.body}</p>
							<small class="text-secondary">
								{comment.username} — {new Date(comment.created).toLocaleString()}
							</small>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-secondary fst-italic">No comments yet. Be the first!</p>
			{/if}
		</div>

		<!-- New Comment Form -->
		<form
			class="bg-dark border border-secondary rounded-3 p-3 shadow-sm"
			on:submit|preventDefault={submitComment}
		>
			<div class="mb-3">
				<textarea
					bind:value={commentText}
					class="form-control bg-dark text-light border-secondary"
					rows="3"
					placeholder="Write a comment..."
					required
				></textarea>
			</div>
			<div class="d-flex justify-content-end">
				<button class="btn btn-primary" disabled={submitting}>
					{#if submitting}
						<span class="spinner-border spinner-border-sm me-2"></span>
						Posting...
					{:else}
						Post Comment
					{/if}
				</button>
			</div>
			{#if commentError}
				<div class="alert alert-danger mt-2 py-2">{commentError}</div>
			{/if}
		</form>
	{/if}
</div>
