import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { replaceMermaidFencesWithImages } from '@/utils/exportMermaidRaster';
import {
  splitMarkdownByDataImages,
  exportImageCaption,
  isMermaidExportImageAlt,
  parseCherryImageDisplaySize,
} from '@/utils/markdownImageData';

/** 将 Markdown 转为导出用 HTML（流程图先栅格化为 PNG，PDF 可正确截图） */
export async function markdownBlocksToExportHtml(
  blocks: { title?: string; body: string }[]
): Promise<string> {
  const parts = await Promise.all(
    blocks.map(async (block) => {
      const titleHtml = block.title
        ? `<h1 class="export-doc-title">${escapeHtml(block.title)}</h1>`
        : '';
      const bodyHtml = await renderBodyToExportHtml(block.body || ' ');
      return `${titleHtml}${bodyHtml}`;
    })
  );
  return `<div class="export-pdf-host export-pdf-host--rich">${parts.join('<hr class="export-doc-sep" />')}</div>`;
}

async function renderBodyToExportHtml(body: string): Promise<string> {
  const prepared = await replaceMermaidFencesWithImages(body);
  const segments = splitMarkdownByDataImages(prepared);
  const inner = segments
    .map((segment) => {
      if (segment.kind === 'image') {
        const caption = exportImageCaption(segment.rawAlt);
        const alt = escapeHtml(
          caption || (isMermaidExportImageAlt(segment.rawAlt) ? '' : '正文图片')
        );
        const size = parseCherryImageDisplaySize(segment.rawAlt);
        const style =
          size.widthPx && size.heightPx
            ? ` style="width:${size.widthPx}px;height:${size.heightPx}px;max-width:100%"`
            : size.widthPx
              ? ` style="width:${size.widthPx}px;max-width:100%;height:auto"`
              : size.widthPct
                ? ` style="width:${size.widthPct}%;max-width:100%;height:auto"`
                : '';
        return `<p><img class="markdown-content__img export-diagram-img" src="${segment.src}" alt="${alt}"${style} /></p>`;
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
