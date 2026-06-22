import { marked } from 'marked';

marked.use({
    breaks: false,
    gfm: true
});

// Article content is now hard-coded and authored in this repo, so it is trusted.
// Rendering with marked alone keeps the markdown usable during static prerendering
// (DOMPurify requires a browser DOM and isn't available at build time).
export function renderMarkdown(text) {
    if (!text) return '';
    return marked.parse(text);
}
