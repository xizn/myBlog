/**
 * 验证 Word 导出能识别 base64 图片 Markdown，而非整行当纯文本。
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

assert.match(markdownImageData, /MARKDOWN_IMAGE_LINE_RE/);
assert.match(markdownImageData, /parseDataImageUrl/);
assert.match(exportDocx, /ImageRun/);
assert.match(exportDocx, /markdownBlocksToDocxChildren/);
assert.match(exportRecord, /markdownBlocksToDocxChildren/);
assert.doesNotMatch(exportRecord, /new TextRun\(line\)/);

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const line = `![image#S #60% #auto](${tinyPng})`;
const re = /^!\[([^\]]*)\]\((data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+)\)\s*$/i;
const m = line.match(re);
assert.ok(m, 'image line should match export regex');
assert.equal(m[2], tinyPng);

console.log('OK verify-export-doc-image');
