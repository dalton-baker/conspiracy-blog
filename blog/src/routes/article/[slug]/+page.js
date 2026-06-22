import { error } from '@sveltejs/kit';
import { articles, getArticle } from '$lib/articles';

// Prerender one page per article slug.
export function entries() {
	return articles.map((a) => ({ slug: a.slug }));
}

export function load({ params }) {
	const article = getArticle(params.slug);

	if (!article) {
		throw error(404, 'Article not found.');
	}

	return { article };
}
