export async function load({ params, fetch }) {
	const articleId = params.id;
	const baseUrl = 'https://truth-data.dalt.dev/articles';

	if (!articleId) {
		return {
			error: 'No article specified.'
		};
	}

	try {
		const res = await fetch(`${baseUrl}/${articleId}.json`);
		if (!res.ok) {
			return {
				error: 'Failed to load article.'
			};
		}

		const article = await res.json();
		article.imageSrc = `https://truth-data.dalt.dev/images/${articleId}.webp`;
		if (article.lastUpdated) {
			article.imageSrc += `?v=${article.lastUpdated}`;
		}

		return {
			article
		};
	} catch (err) {
		console.error(err);
		return {
			error: 'Failed to load article.'
		};
	}
}
