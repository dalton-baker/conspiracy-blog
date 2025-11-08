<svelte:head>
	<style>
		.article-hero {
            position: relative;
            height: 300px;
            overflow: hidden;
            border-radius: .5rem;
        }

        .article-hero img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: brightness(0.6);
        }

        .article-hero .overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 2rem;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
        }

        article {
            background: #f8f9fa;
            color: #212529;
            border-radius: .5rem;
            padding: 2rem;
            margin-top: -2rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.3);
        }
	</style>
</svelte:head>

<script>
	let { children } = $props();
</script>

{@render children()}