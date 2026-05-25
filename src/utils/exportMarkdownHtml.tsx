import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';

/** 将 Markdown 转为导出用 HTML（含样式类名） */
export function markdownBlocksToExportHtml(
  blocks: { title?: string; body: string }[]
): string {
  const parts = blocks.map((block) => {
    const titleHtml = block.title
      ? `<h1 class="export-doc-title">${escapeHtml(block.title)}</h1>`
      : '';
    const bodyHtml = renderToStaticMarkup(
      <article className="markdown-content export-markdown-body">
        <ReactMarkdown rehypePlugins={[rehypeSlug]}>{block.body || ' '}</ReactMarkdown>
      </article>
    );
    return `${titleHtml}${bodyHtml}`;
  });
  return `<div class="export-pdf-host export-pdf-host--rich">${parts.join('<hr class="export-doc-sep" />')}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
