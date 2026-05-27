/**
 * Mermaid：阅读页组件 + Cherry 内置引擎多图修补
 * 运行：node scripts/verify-cherry-mermaid.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const mermaidSrc = readFileSync(join(root, 'src/utils/cherryMermaidRenderer.ts'), 'utf8');
const loaderSrc = readFileSync(join(root, 'src/utils/cherryMarkdownLoader.ts'), 'utf8');
const bodySrc = readFileSync(join(root, 'src/components/learning/MarkdownBody.tsx'), 'utf8');
const diagramSrc = readFileSync(join(root, 'src/components/learning/MermaidDiagram.tsx'), 'utf8');
const editorSrc = readFileSync(join(root, 'src/components/form/MarkdownSplitEditor.tsx'), 'utf8');

assert(existsSync(join(root, 'src/components/learning/MermaidDiagram.tsx')), 'MermaidDiagram missing');
assert(mermaidSrc.includes('patchCherryBuiltinMermaidEngine'), 'mermaid patch missing');
assert(mermaidSrc.includes('renderMermaidSvgHtml'), 'shared mermaid render missing');
assert(loaderSrc.includes('patchCherryBuiltinMermaidEngine'), 'loader should patch mermaid after script load');
assert(bodySrc.includes('MermaidDiagram'), 'MarkdownBody should render mermaid blocks');
assert(diagramSrc.includes('renderMermaidForReadPage'), 'read page should use cherry mermaid');
assert(!editorSrc.includes('getCherryMermaidRendererConfig'), 'editor should use builtin engine + patch');

console.log('OK: mermaid read page + cherry patch checks');
