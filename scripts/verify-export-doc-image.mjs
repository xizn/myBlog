/**
 * 验证 Word 导出能识别 base64 图片 Markdown，且 Cherry alt 标记会被剥离。
 * 运行：node scripts/verify-export-doc-image.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const markdownImageData = readFileSync(
  join(root, 'src/utils/markdownImageData.ts'),
  'utf8'
);
const exportDocx = readFileSync(join(root, 'src/utils/exportDocxMarkdown.ts'), 'utf8');
const exportRecord = readFileSync(join(root, 'src/utils/exportRecord.ts'), 'utf8');
const exportDownload = readFileSync(join(root, 'src/utils/exportDownload.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.cjs'), 'utf8');
const main = readFileSync(join(root, 'electron/main.cjs'), 'utf8');

assert.match(markdownImageData, /MARKDOWN_IMAGE_LINE_RE/);
assert.match(markdownImageData, /parseDataImageUrl/);
assert.match(markdownImageData, /exportImageCaption/);
assert.match(exportDocx, /ImageRun/);
assert.match(exportDocx, /markdownBlocksToDocxChildren/);
assert.match(exportDocx, /measureDataImageSizeForExport/);
assert.match(exportRecord, /markdownBlocksToDocxChildren/);
assert.doesNotMatch(exportRecord, /new TextRun\(line\)/);
assert.match(exportRecord, /commitExportDownload/);
assert.match(exportRecord, /ExportDownloadContext/);
assert.match(exportDownload, /showSaveFilePicker/);
assert.match(exportDownload, /prepareExportDownload/);
assert.doesNotMatch(preload, /file:save-download/);
assert.doesNotMatch(main, /registerDownloadIpc/);

const CHERRY_ALT_MARK_RE =
  /#(?:center|right|left|float-right|float-left|border|shadow|radius|B|S|R|auto|\d+(?:px|em|pt|pc|in|mm|cm|ex|%)?)/gi;

function stripCherryImageAlt(alt) {
  return alt.replace(CHERRY_ALT_MARK_RE, '').replace(/\s+/g, ' ').trim();
}

function exportImageCaption(alt) {
  const label = stripCherryImageAlt(alt);
  return !label || /^image$/i.test(label) ? '' : label;
}

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const line = `![image#S #60% #auto](${tinyPng})`;
const re = /^!\[([^\]]*)\]\((data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+)\)\s*$/i;
const m = line.match(re);
assert.ok(m, 'image line should match export regex');
assert.equal(m[2], tinyPng);
assert.equal(stripCherryImageAlt('image#S #60% #auto'), 'image');
assert.equal(exportImageCaption('image#S #60% #auto'), '');

console.log('OK verify-export-doc-image');
