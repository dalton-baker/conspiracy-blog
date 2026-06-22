<script>
    import { formatDate } from '$lib';
    import { articles } from '$lib/articles';
</script>

<h1 class="mb-5 text-center display-5 fw-bold">Wake Up Sheeple</h1>

<div class="row g-4">
    {#each articles as article}
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 bg-secondary text-light border-light shadow-sm">
                <img src="{article.imageSrc}" class="card-img-top" alt="{article.title} image">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">{article.title}</h5>
                    <p class="card-text flex-grow-1">{article.summary}</p>
                    <div class="mt-3">
                        <small class="text-warning">{formatDate(article.date)}</small><br>
                        <a href="{`/article/${article.slug}`}" class="btn btn-outline-light btn-sm mt-2 stretched-link">Read More</a>
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>
