/**
 * 回归：Cherry 资源、加载器、历史弹窗不透明
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
assert(!modalCss.includes('rgba(30, 24, 16, 0.35)'), 'history modal still uses transparent backdrop');

const editorSrc = readFileSync(join(root, 'src/components/form/MarkdownSplitEditor.tsx'), 'utf8');
assert(editorSrc.includes('loadCherryMarkdown'), 'MarkdownSplitEditor should use Cherry');

console.log('OK: cherry + modal source regression checks');
