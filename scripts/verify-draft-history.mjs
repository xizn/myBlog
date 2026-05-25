/**
 * 验证「历史笔记与草稿」弹层可打开，选择草稿后出现在顶栏标签
 * 用法：先 npm run dev，再 node scripts/verify-draft-history.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/learning/new`, { waitUntil: 'networkidle' });
  await page.waitForURL(/\/learning\/draft\//, { timeout: 15000 });
  await page.waitForSelector('.editor-draft-panel--active #title', { timeout: 15000 });

  await page.locator('.editor-draft-panel--active #title').fill('当前-编辑中');
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: '+ 新建笔记' }).click();
  await page.waitForTimeout(500);
  await page.locator('.editor-draft-panel--active #title').fill('另一条草稿');
  await page.waitForTimeout(400);

  const tabsBefore = await page.locator('.form-editor-tab').count();
  if (tabsBefore < 2) throw new Error(`应有至少 2 个标签，实际 ${tabsBefore}`);

  await page.getByRole('button', { name: '历史笔记与草稿' }).click();
  await page.waitForSelector('.async-dialog-preparing', { timeout: 3000 }).catch(() => null);
  await page.waitForSelector('.editor-draft-history__panel', { timeout: 15000 });
  const panelOpaque = await page.evaluate(() => {
    const panel = document.querySelector('.editor-draft-history__panel');
    const inner = document.querySelector('.editor-draft-history__panel-inner');
    if (!panel || !inner) return false;
    const bg = getComputedStyle(panel).backgroundColor;
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
  });
  if (!panelOpaque) {
    throw new Error('历史弹窗面板应为不透明背景');
  }
  const panelHeight = await page.locator('.editor-draft-history__panel').evaluate((el) => el.getBoundingClientRect().height);
  if (panelHeight < 400) {
    throw new Error(`历史弹窗高度异常：${panelHeight}`);
  }

  const draftPick = page.locator('.editor-draft-history__section').first().locator('.editor-draft-history__item').first();
  const draftTitle = (await draftPick.locator('.editor-draft-history__item-title').innerText()).trim();
  await draftPick.click();
  await page.waitForTimeout(400);

  const tabCount = await page.locator('.form-editor-tab').count();
  if (tabCount < 2) throw new Error('选择草稿后标签行应保留多条');

  const activeTitle = await page.locator('.editor-draft-panel--active #title').inputValue();
  if (activeTitle !== draftTitle) {
    throw new Error(`选择历史草稿后标题应为「${draftTitle}」，实际「${activeTitle}」`);
  }

  console.log('OK: 历史笔记与草稿 — 选择后写入顶栏标签并切换内容');
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
