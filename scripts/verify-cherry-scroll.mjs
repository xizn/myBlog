import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`${baseUrl}/learning/new`, { waitUntil: 'networkidle' });
await page.waitForURL(/\/learning\/draft\//);
await page.waitForSelector('.md-split-editor__cherry-root--ready', { timeout: 20000 });

const longBody = Array.from({ length: 80 }, (_, i) => `- 行 ${i + 1}`).join('\n');
await page.locator('.editor-draft-panel--active .CodeMirror textarea').first().fill(longBody);
await page.waitForTimeout(900);

const layout = await page.evaluate(() => {
  const editor = document.querySelector('.editor-draft-panel--active .cherry-editor');
  const preview = document.querySelector('.editor-draft-panel--active .cherry-previewer');
  if (!editor || !preview) return { ok: false, reason: 'missing panes' };
  const er = editor.getBoundingClientRect();
  const pr = preview.getBoundingClientRect();
  return {
    ok: Math.abs(er.top - pr.top) < 12 && pr.left >= er.right - 4 && er.width > 120,
    editorH: er.height,
    previewH: pr.height,
  };
});
if (!layout.ok) {
  throw new Error(`左右分栏异常: ${JSON.stringify(layout)}`);
}

const scroll = await page.evaluate(() => {
  const scroller = document.querySelector('.editor-draft-panel--active .CodeMirror-scroll');
  if (!scroller) return { ok: false, reason: 'no scroller' };
  if (scroller.scrollHeight <= scroller.clientHeight + 8) {
    return { ok: false, reason: 'not scrollable', sh: scroller.scrollHeight, ch: scroller.clientHeight };
  }
  scroller.scrollTop = 0;
  scroller.scrollTop = 180;
  return { ok: scroller.scrollTop > 0, st: scroller.scrollTop };
});
if (!scroll.ok) {
  throw new Error(`编辑区不可滚动: ${JSON.stringify(scroll)}`);
}

const dragHidden = await page.evaluate(() => {
  const drag = document.querySelector('.editor-draft-panel--active .cherry-drag');
  return !drag || getComputedStyle(drag).display === 'none';
});
if (!dragHidden) {
  throw new Error('中间分栏拖拽线应隐藏');
}

const syncOk = await page.evaluate(async () => {
  const cmScroll = document.querySelector('.editor-draft-panel--active .CodeMirror-scroll');
  const preview = document.querySelector('.editor-draft-panel--active .cherry-previewer');
  if (!cmScroll || !preview) return { ok: false, reason: 'missing' };
  if (preview.scrollHeight <= preview.clientHeight + 8) return { ok: true, reason: 'short preview' };
  const editorBg = getComputedStyle(
    document.querySelector('.editor-draft-panel--active .cherry-editor')
  ).backgroundColor;
  const opaque =
    editorBg === 'rgb(255, 255, 255)' || editorBg.startsWith('rgb(255, 255, 255)');
  if (!opaque && !editorBg.includes('28, 27')) {
    return { ok: false, reason: `editor not opaque: ${editorBg}` };
  }
  cmScroll.scrollTop = 0;
  preview.scrollTop = 0;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const before = preview.scrollTop;
  cmScroll.scrollTop = Math.min(320, cmScroll.scrollHeight - cmScroll.clientHeight);
  cmScroll.dispatchEvent(new Event('scroll', { bubbles: true }));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const delta = Math.abs(preview.scrollTop - before);
  return { ok: delta > 40, before, after: preview.scrollTop, delta, maxP: preview.scrollHeight - preview.clientHeight };
});
if (!syncOk.ok) {
  throw new Error(`编辑区滚动时预览区应联动: ${JSON.stringify(syncOk)}`);
}

console.log('OK: Cherry 左右分栏 + 滚动 + 预览联动 + 隐藏拖拽线');
await browser.close();
