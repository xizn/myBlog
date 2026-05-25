/**
 * 回归：Cherry 资源、加载器、历史抽屉、正文检索
 * 用法：node scripts/verify-markdown-helpers.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(existsSync(join(root, 'public/vendor/cherry-markdown/cherry-markdown.js')), 'cherry-markdown.js missing');
assert(existsSync(join(root, 'public/vendor/cherry-markdown/cherry-markdown.css')), 'cherry-markdown.css missing');

const loaderSrc = readFileSync(join(root, 'src/utils/cherryMarkdownLoader.ts'), 'utf8');
assert(loaderSrc.includes('/vendor/cherry-markdown/cherry-markdown.js'), 'cherry loader path missing');

const modalCss = readFileSync(join(root, 'src/components/form/EditorDraftHistoryModal.css'), 'utf8');
assert(modalCss.includes('editor-draft-history__panel-inner'), 'history panel inner wrap missing');
assert(modalCss.includes('right: 0'), 'history should be right drawer');
assert(modalCss.includes('rgba(28, 25, 23, 0.42)'), 'history backdrop should be semi-transparent');
assert(modalCss.includes('translateX(100%)'), 'history drawer slide animation missing');

const cherryCss = readFileSync(join(root, 'src/components/form/CherryMarkdownEditor.css'), 'utf8');
assert(cherryCss.includes('flex-flow: row wrap'), 'cherry should use row wrap split layout');
assert(!cherryCss.includes('flex-direction: column !important'), 'cherry must not force column layout');
assert(cherryCss.includes('.cherry-drag'), 'cherry drag line should be hidden in blog editor');
assert(!cherryCss.includes('width: 50% !important'), 'do not override cherry pane widths');
assert(cherryCss.includes('background: #ffffff'), 'editor panes use opaque white');
assert(
  readFileSync(join(root, 'src/utils/cherryEditorPreviewSync.ts'), 'utf8').includes('bindCherryEditorPreviewScroll'),
  'explicit editor-preview scroll sync missing'
);

const editorSrc = readFileSync(join(root, 'src/components/form/MarkdownSplitEditor.tsx'), 'utf8');
assert(editorSrc.includes('loadCherryMarkdown'), 'MarkdownSplitEditor should use Cherry');
assert(editorSrc.includes('md-split-editor__search-input'), 'editor search UI missing');
assert(
  editorSrc.includes('position: sticky') ||
    readFileSync(join(root, 'src/components/form/MarkdownSplitEditor.css'), 'utf8').includes('position: sticky'),
  'sticky chrome missing'
);

const blogSrc = readFileSync(join(root, 'src/components/learning/MarkdownContent.tsx'), 'utf8');
assert(blogSrc.includes('MarkdownZoomableImage'), 'blog image zoom missing');

console.log('OK: cherry + drawer + search + image zoom regression checks');
