<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { colorForUser } from '$lib';

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
			<div class="spinner-border text-info" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if error}
		<div class="alert alert-danger">{error}</div>
	{:else if post}
		<!-- Post Header -->
		<article class="mb-5">
			<h2 class="fw-bold mb-2">{post.title}</h2>
			<div class="d-flex flex-wrap align-items-center text-secondary small mb-3 border-bottom border-secondary pb-2">
				<span class="me-2 fw-semibold" style="color: {colorForUser(comment.username)}">{post.username}</span>
				<span>• {new Date(post.created).toLocaleString()}</span>
			</div>
			<p class="fs-5 lh-base text-light">{post.body}</p>
		</article>

		<!-- Comments Section -->
		<section class="mb-5">
			<h5 class="mb-3 border-bottom border-secondary pb-2">Comments</h5>
			{#if post.comments && post.comments.length > 0}
				<div class="d-flex flex-column gap-3">
					{#each post.comments as comment}
						<div class="ps-3 border-start border-3 border-secondary">
							<p class="mb-1 text-light">{comment.body}</p>

                            <small class="text-secondary">
                                <span class="fw-semibold" style="color: {colorForUser(comment.username)}">
                                    {comment.username}
                                </span>
                                • {new Date(comment.created).toLocaleString()}
                            </small>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-secondary fst-italic">No comments yet. Be the first!</p>
			{/if}
		</section>

		<!-- New Comment Form -->
		<section class="pt-3 border-top border-secondary">
			<h6 class="fw-semibold mb-3">Add a comment</h6>
			<form onsumit={submitComment}>
				<div class="mb-3">
					<textarea
						bind:value={commentText}
						class="form-control bg-dark text-light border-secondary"
						rows="3"
						placeholder="Write something insightful..."
						required
					></textarea>
				</div>
				<div class="d-flex justify-content-end">
					<button class="btn btn-info text-dark fw-semibold" disabled={submitting}>
						{#if submitting}
							<span class="spinner-border spinner-border-sm me-2"></span> Posting...
						{:else}
							Post Comment
						{/if}
					</button>
				</div>
				{#if commentError}
					<div class="alert alert-danger mt-3 py-2">{commentError}</div>
				{/if}
			</form>
		</section>
	{/if}
</div>

<style>
	textarea:focus {
		border-color: var(--bs-info) !important;
		box-shadow: 0 0 0 0.2rem rgba(13, 202, 240, 0.25);
	}
</style>
