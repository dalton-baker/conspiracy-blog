<script>
  let post = { title: '', summary: '', content: '' };
  let imageFile = null;
  let imagePreview = '';
  let status = '';

  function handleImageChange(e) {
    imageFile = e.target.files?.[0];
    if (imageFile) imagePreview = URL.createObjectURL(imageFile);
  }

  async function submit() {
    try {
      status = '⏳ Uploading...';

      const form = new FormData();
      form.append('title', post.title);
      form.append('summary', post.summary);
      form.append('content', post.content);
      if (imageFile) form.append('image', imageFile);

      const res = await fetch('/admin/blog-post', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Failed to save');

      status = '✅ Article saved!';
    } catch (err) {
      console.error(err);
      status = `❌ ${err.message}`;
    }
  }
</script>


<div class="container bg-dark text-light p-4 rounded mt-5 shadow-lg" style="max-width: 800px;">
  <h1 class="mb-4 border-bottom pb-2">📝 New Article</h1>

  <div class="mb-3">
    <label for="title" class="form-label">Title</label>
    <input id="title" class="form-control bg-secondary text-light border-0" bind:value={post.title} />
  </div>

  <div class="mb-3">
    <label for="summary" class="form-label">Summary</label>
    <textarea id="summary" class="form-control bg-secondary text-light border-0" rows="2" bind:value={post.summary}></textarea>
  </div>

  <div class="mb-3">
    <label for="image" class="form-label">Header Image</label>
    <input id="image" type="file" accept="image/*" class="form-control bg-secondary text-light border-0" on:change={handleImageChange} />
    {#if imagePreview}
      <div class="mt-3 text-center">
        <img src={imagePreview} alt="Preview" class="img-fluid rounded border border-light" style="max-height: 200px;" />
      </div>
    {/if}
  </div>

  <div class="mb-3">
    <label for="content" class="form-label">Content (HTML supported)</label>
    <textarea id="content" class="form-control bg-secondary text-light border-0" rows="10" bind:value={post.content}></textarea>
  </div>

  <div class="d-flex justify-content-between align-items-center mb-4">
    <button class="btn btn-primary px-4" on:click={submit}>Publish</button>
    <p class="m-0">{status}</p>
  </div>

  <div class="bg-secondary p-3 rounded">
    <h5 class="border-bottom pb-2 mb-3">Live Preview</h5>
    <div class="bg-dark p-3 rounded" style="min-height: 100px;"> {@html post.content}</div>
  </div>
</div>
