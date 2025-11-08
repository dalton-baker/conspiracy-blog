<script>
  let title = '';
  let summary = '';
  let content = '';
  let image = '';
  let status = '';

  async function submit() {
    const res = await fetch('/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, summary, content, image })
    });
    status = res.ok ? '✅ Article saved!' : '❌ Failed to save.';
  }
</script>

<h1>New Article</h1>

<div class="mb-3">
  <label for="title">Title</label>
  <input id="title" class="form-control" bind:value={title} />
</div>

<div class="mb-3">
  <label for="summary">Summary</label>
  <textarea id="summary" class="form-control" bind:value={summary}></textarea>
</div>

<div class="mb-3">
  <label for="image">Image URL</label>
  <input id="image" class="form-control" bind:value={image} />
</div>

<div class="mb-3">
  <label for="article">Content</label>
  <textarea id="article" class="form-control" rows="10" bind:value={content}></textarea>
</div>

<button class="btn btn-primary" on:click={submit}>Publish</button>
<p>{status}</p>