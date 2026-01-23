import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({
    breaks: false,
    gfm: true
});

export function renderMarkdown(text) {
    if (!text) return '';
    const dirty = marked.parse(text);
    const clean = DOMPurify.sanitize(dirty, {
        ADD_ATTR: ['target', 'rel'],
    });
    return clean;
}