export const load = async ({ params, fetch }) => {
    const { articleId } = params; 
    const articleUrl = `https://truth-data.dalt.dev/articles/${articleId}.json`

    const articleRes = await fetch(articleUrl);
    if (!articleRes.ok) {
        throw new Error(`Failed to fetch event results: ${articleRes.status}`);
    }

    const article = await articleRes.json();
    return article;
};