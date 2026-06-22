// Articles are hard-coded as JSON data files in ./articles/*.json and bundled
// at build time. This powers the fully prerendered blog (no runtime API calls).
const modules = import.meta.glob('./articles/*.json', { eager: true });

/** @type {Array<{slug: string, title: string, summary: string, date: string, content: string, imageSrc: string}>} */
export const articles = Object.values(modules)
	.map((m) => {
		const article = m.default ?? m;
		return {
			...article,
			imageSrc: `/images/${article.slug}.webp`
		};
	})
	.sort((a, b) => b.date.localeCompare(a.date));

const bySlug = new Map(articles.map((a) => [a.slug, a]));

export function getArticle(slug) {
	return bySlug.get(slug);
}
