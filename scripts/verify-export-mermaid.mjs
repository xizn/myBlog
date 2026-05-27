/**
 * 导出应先把 Mermaid 栅格化为 PNG，再走 ReactMarkdown / docx 图片
 * 运行：node scripts/verify-export-mermaid.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const exportHtml = readFileSync(join(root, 'src/utils/exportMarkdownHtml.tsx'), 'utf8');
const exportRaster = readFileSync(join(root, 'src/utils/exportMermaidRaster.ts'), 'utf8');
const exportDocx = readFileSync(join(root, 'src/utils/exportDocxMarkdown.ts'), 'utf8');

assert(exportHtml.includes('replaceMermaidFencesWithImages'), 'PDF/HTML export must rasterize mermaid');
assert(!exportHtml.includes('renderMarkdownWithCherryHtml'), 'export should not rely on cherry html for PDF');
assert(exportRaster.includes('findMermaidFences'), 'export must detect generic ``` blocks');
assert(exportRaster.includes('looksLikeMermaidSource'), 'export must detect graph LR without lang');
assert(exportRaster.includes('loadCherryMarkdown'), 'export must load mermaid runtime');
assert(exportRaster.includes('renderMermaidSvgHtmlAsync'), 'export must use mermaid renderAsync');
assert(
  readFileSync(join(root, 'src/utils/cherryMermaidRenderer.ts'), 'utf8').includes('mermaidAPIRefs'),
  'mermaid API must come from Cherry builtin engine'
);
const renderer = readFileSync(join(root, 'src/utils/cherryMermaidRenderer.ts'), 'utf8');
assert(renderer.includes("theme: 'base'"), 'export must use light base theme');
assert(renderer.includes('primaryTextColor'), 'export must set black text');
assert(
  readFileSync(join(root, 'src/utils/markdownImageData.ts'), 'utf8').includes('measureMermaidDiagramSizeForDocx'),
  'docx must size mermaid by aspect ratio'
);
assert(exportRaster.includes('warmMermaidDiagramEngine'), 'export must warm mermaid lazy loaders');
assert(exportRaster.includes('replaceMermaidViaCherryHtml'), 'export must cherry-html fallback');
assert(exportDocx.includes('replaceMermaidFencesWithImages'), 'docx export must rasterize mermaid');

console.log('OK: export mermaid raster pipeline');
