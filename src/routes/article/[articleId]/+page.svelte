<script>
	import image from '$lib/assets/articles/empire-state-building.jpg';
    const { data } = $props();
</script>

<div class="container my-4">
    <div class="article-hero">
        <img src="{data.image}" alt="{data.title} image">
        <div class="overlay text-light">
            <h2 class="fw-bold">{data.title}</h2>
            <p class="mb-0">{data.date}</p>
        </div>
    </div>
</div>

<div class="container mb-5">
    <article class="container py-4">
        {@html data.content}
    </article>
</div>