/**
 * Cherry base64 图片拖拽改尺寸：URL 修复与整段替换
 * 运行：node scripts/verify-cherry-data-image.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/utils/cherryDataImageMarkdown.ts'), 'utf8');
const editor = readFileSync(join(root, 'src/components/form/MarkdownSplitEditor.tsx'), 'utf8');

assert.match(src, /patchCherryDataImageResize/);
assert.match(src, /isImgResizing/);
assert.match(src, /replaceDataImageSizeInMarkdown/);
assert.match(src, /repairDataImageUrl/);
assert.match(editor, /patchCherryDataImageResize/);

const CHERRY_ALT_MARK_RE =
  /#(?:center|right|left|float-right|float-left|border|shadow|radius|B|S|R|auto|\d+(?:px|em|pt|pc|in|mm|cm|ex|%)?)/gi;

function stripCherryImageAlt(alt) {
  return alt.replace(CHERRY_ALT_MARK_RE, '').replace(/\s+/g, ' ').trim();
}

function repairDataImageUrl(url) {
  const m = url.match(/^data:image\/([^;]*);base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) return url;
  let mime = m[1].replace(/#[^\s#]*/g, '').replace(/\s+/g, '').toLowerCase();
  if (mime === 'pn' || mime.startsWith('pn')) mime = 'png';
  else if (!/^[a-z0-9+.-]{2,12}$/.test(mime)) mime = 'png';
  return `data:image/${mime};base64,${m[2]}`;
}

function normalizeCherryDataImageAlt(alt) {
  const px = [...alt.matchAll(/#(\d+)px/gi)].map((m) => parseInt(m[1], 10));
  const widthPx = px.length >= 2 ? px[px.length - 2] : px.length === 1 ? px[0] : undefined;
  const heightPx = px.length >= 2 ? px[px.length - 1] : undefined;
  const label = stripCherryImageAlt(alt) || 'image';
  let result = label;
  if (widthPx !== undefined && heightPx !== undefined) {
    result += `#${widthPx}px #${heightPx}px`;
  } else if (widthPx !== undefined) {
    result += `#${widthPx}px`;
  }
  if (/#S\b/i.test(alt)) result += ' #S';
  return result;
}

const brokenUrl = 'data:image/pn#172px #63px #Sg;base64,ABC=';
assert.equal(repairDataImageUrl(brokenUrl), 'data:image/png;base64,ABC=');

const corrupted = `![image#180px #66px #S](${brokenUrl})`;
const fixed = corrupted.replace(
  /!\[([^\]]*)\]\((data:image\/[^)]*?;base64,[A-Za-z0-9+/=]+)\)/i,
  (_f, alt, url) => `![${normalizeCherryDataImageAlt(alt)}](${repairDataImageUrl(url)})`
);
assert.equal(fixed, '![image#180px #66px #S](data:image/png;base64,ABC=)');

console.log('OK verify-cherry-data-image');
