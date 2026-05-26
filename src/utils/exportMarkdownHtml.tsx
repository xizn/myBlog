import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { splitMarkdownByDataImages, exportImageCaption, parseCherryImageDisplaySize } from '@/utils/markdownImageData';

/** 将 Markdown 转为导出用 HTML（含样式类名） */
export function markdownBlocksToExportHtml(
  blocks: { title?: string; body: string }[]
): string {
  const parts = blocks.map((block) => {
    const titleHtml = block.title
      ? `<h1 class="export-doc-title">${escapeHtml(block.title)}</h1>`
      : '';
    const bodyHtml = renderBodyToExportHtml(block.body || ' ');
    return `${titleHtml}${bodyHtml}`;
  });
  return `<div class="export-pdf-host export-pdf-host--rich">${parts.join('<hr class="export-doc-sep" />')}</div>`;
}

function renderBodyToExportHtml(body: string): string {
  const segments = splitMarkdownByDataImages(body);
  const inner = segments
    .map((segment) => {
      if (segment.kind === 'image') {
        const alt = escapeHtml(exportImageCaption(segment.rawAlt) || '正文图片');
        const size = parseCherryImageDisplaySize(segment.rawAlt);
        const style =
          size.widthPx && size.heightPx
            ? ` style="width:${size.widthPx}px;height:${size.heightPx}px;max-width:100%"`
            : size.widthPx
              ? ` style="width:${size.widthPx}px;max-width:100%;height:auto"`
              : size.widthPct
                ? ` style="width:${size.widthPct}%;max-width:100%;height:auto"`
                : '';
        return `<p><img class="markdown-content__img" src="${segment.src}" alt="${alt}"${style} /></p>`;
      }
      return renderToStaticMarkup(
        <article className="markdown-content export-markdown-body">
          <ReactMarkdown rehypePlugins={[rehypeSlug]}>{segment.text}</ReactMarkdown>
        </article>
      );
    })
    .join('');
  return `<div class="export-markdown-body-wrap">${inner}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
