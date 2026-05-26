/**
 * 回归：Cherry 自定义 Mermaid 渲染器 + 深色历史抽屉样式
 * 用法：node scripts/verify-cherry-mermaid.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(existsSync(join(root, 'public/vendor/cherry-markdown/cherry-markdown.js')), 'cherry-markdown.js missing');

const rendererSrc = readFileSync(join(root, 'src/utils/cherryMermaidRenderer.ts'), 'utf8');
assert(rendererSrc.includes('class CherryMermaidEngine'), 'custom mermaid engine missing');
assert(rendererSrc.includes('container.remove()'), 'per-block mermaid container cleanup missing');
assert(rendererSrc.includes('getCherryMermaidRendererConfig'), 'mermaid config helper missing');

const editorSrc = readFileSync(join(root, 'src/components/form/MarkdownSplitEditor.tsx'), 'utf8');
assert(editorSrc.includes('getCherryMermaidRendererConfig(isAppDarkTheme())'), 'editor should wire custom mermaid renderer');

const polishCss = readFileSync(join(root, 'src/styles/dark-theme-polish.css'), 'utf8');
assert(
  polishCss.includes('.editor-draft-history__item'),
  'dark theme polish should style history draft items'
);
assert(
  polishCss.includes('backdrop-filter: none'),
  'history draft items should not blur bright editor behind drawer'
);

const modalCss = readFileSync(join(root, 'src/components/form/EditorDraftHistoryModal.css'), 'utf8');
assert(modalCss.includes('color: var(--text)'), 'history item text color should be explicit');

console.log('OK: cherry mermaid renderer + dark history drawer checks');
