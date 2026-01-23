<script>
    import { onMount } from 'svelte';
    import { formatDate } from '$lib';
    
    let error = '';
    let loading = true;
    let articles = [];

    onMount(async () => await loadPosts());

    async function loadPosts(){
        try {
            const res = await fetch('https://truth-data.dalt.dev/summaries.json');
            if (!res.ok) {
                error = 'Failed to load articles.';
            } else {
                articles = await res.json();
                articles.sort((a, b) => b.date.localeCompare(a.date));
            }
        } catch (err) {
            console.error(err);
            error = 'Failed to load articles.';
        } finally {
            loading = false;
        }
    }

    async function deleteArticle(id) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        // Replace this with your actual API call or R2 delete logic
        try {
            await fetch(`/admin/article-api?id=${id}`, { method: 'DELETE' });
            await loadPosts();
        } catch (err) {
            console.error(err);
            alert('Failed to delete article.');
        }
    }
</script>

<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-light">Manage Posts</h2>
        <a class="btn btn-success btn-sm" href="/admin/add-article">+ Add New Post</a>
    </div>

    {#if loading}
        <div class="p-5 text-center text-secondary">Loading...</div>
    {:else if error}
        <div class="p-5 text-danger text-center">{error}</div>
    {:else if articles.length === 0}
        <div class="p-5 text-center text-secondary">No posts found.</div>
    {:else}
        <div class="table-responsive">
            <table class="table table-dark table-striped align-middle">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th style="width: 150px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each articles as article}
                        <tr>
                            <td>{article.title}</td>
                            <td>{formatDate(article.date)}</td>
                            <td>
                                <div class="btn-group">
                                    <a class="btn btn-sm btn-outline-warning" href="/admin/edit-article?id={article.id}">Edit</a>
                                    <button class="btn btn-sm btn-outline-danger" on:click={() => deleteArticle(article.id)}>Delete</button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
