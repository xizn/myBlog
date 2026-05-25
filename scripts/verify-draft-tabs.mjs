/**
 * 验证多窗口草稿：切换标签时标题输入框应随草稿变化
 * 用法：先 npm run dev，再 node scripts/verify-draft-tabs.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';

async function activeTitle(page) {
  return page.locator('.editor-draft-panel--active #title').inputValue();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/learning/new`, { waitUntil: 'networkidle' });
  await page.waitForURL(/\/learning\/draft\//, { timeout: 15000 });
  await page.waitForSelector('.editor-draft-panel--active #title', { timeout: 15000 });

  await page.locator('.editor-draft-panel--active #title').fill('笔记-Alpha');
  await page.waitForTimeout(400);

  const titleA = await activeTitle(page);
  if (titleA !== '笔记-Alpha') {
    throw new Error(`草稿 A 标题应为「笔记-Alpha」，实际为「${titleA}」`);
  }

  await page.getByRole('button', { name: '+ 新建笔记' }).click();
  await page.waitForTimeout(600);
  await page.waitForSelector('.editor-draft-panel--active #title', { timeout: 15000 });

  await page.locator('.editor-draft-panel--active #title').fill('笔记-Beta');
  await page.waitForTimeout(400);

  const titleB = await activeTitle(page);
  if (titleB !== '笔记-Beta') {
    throw new Error(`草稿 B 标题应为「笔记-Beta」，实际为「${titleB}」`);
  }

  const tabs = page.locator('.form-editor-tab__label');
  const tabCount = await tabs.count();
  if (tabCount < 2) {
    throw new Error(`应至少 2 个标签，实际 ${tabCount}`);
  }

  await tabs.nth(0).click();
  await page.waitForTimeout(300);
  const afterSwitchToA = await activeTitle(page);
  if (afterSwitchToA !== '笔记-Alpha') {
    throw new Error(
      `切回标签 A 后标题应为「笔记-Alpha」，实际为「${afterSwitchToA}」（路由: ${page.url()}）`
    );
  }

  await tabs.nth(1).click();
  await page.waitForTimeout(300);
  const afterSwitchToB = await activeTitle(page);
  if (afterSwitchToB !== '笔记-Beta') {
    throw new Error(
      `切到标签 B 后标题应为「笔记-Beta」，实际为「${afterSwitchToB}」（路由: ${page.url()}）`
    );
  }

  console.log('OK: 学习笔记多窗口切换 — 标题随标签正确变化');

  await page.goto(`${baseUrl}/agents/new`, { waitUntil: 'networkidle' });
  await page.waitForURL(/\/agents\/draft\//, { timeout: 15000 });
  await page.waitForSelector('.editor-draft-panel--active #title', { timeout: 15000 });

  await page.locator('.editor-draft-panel--active #title').fill('项目-Gamma');
  await page.waitForTimeout(400);
  if ((await activeTitle(page)) !== '项目-Gamma') {
    throw new Error('Agent 草稿 A 标题未保存');
  }

  await page.getByRole('button', { name: '+ 新建项目' }).click();
  await page.waitForTimeout(600);
  await page.locator('.editor-draft-panel--active #title').fill('项目-Delta');
  await page.waitForTimeout(400);

  const agentTabs = page.locator('.form-editor-tab__label');
  await agentTabs.nth(0).click();
  await page.waitForTimeout(300);
  if ((await activeTitle(page)) !== '项目-Gamma') {
    throw new Error(`Agent 切回 A 失败，实际「${await activeTitle(page)}」`);
  }
  await agentTabs.nth(1).click();
  await page.waitForTimeout(300);
  if ((await activeTitle(page)) !== '项目-Delta') {
    throw new Error(`Agent 切到 B 失败，实际「${await activeTitle(page)}」`);
  }

  console.log('OK: Agent 多窗口切换 — 标题随标签正确变化');

  // Regression: 编辑后标签显示草稿圆点
  await page.goto(`${baseUrl}/learning/new`, { waitUntil: 'networkidle' });
  await page.waitForURL(/\/learning\/draft\//, { timeout: 15000 });
  await page.locator('.editor-draft-panel--active #title').fill('圆点测试');
  await page.waitForTimeout(400);
  const activeTab = page.locator('.form-editor-tab--active');
  const dotCount = await activeTab.locator('.form-editor-tab__dot').count();
  if (dotCount < 1) {
    throw new Error('编辑后活动标签应显示草稿圆点');
  }
  console.log('OK: 学习笔记草稿圆点 — 编辑后可见');

  // Regression: Cherry Markdown 编辑器加载与分栏
  await page.waitForSelector('.editor-draft-panel--active .md-split-editor__cherry-root--ready', {
    timeout: 20000,
  });
  const longBody = Array.from({ length: 80 }, (_, i) => `- 行 ${i + 1}`).join('\n');
  const cm = page.locator('.editor-draft-panel--active .CodeMirror textarea').first();
  await cm.waitFor({ timeout: 10000 });
  await cm.fill(longBody);
  await page.waitForTimeout(400);

  const cherryOk = await page.evaluate(() => {
    const cherry = document.querySelector('.editor-draft-panel--active .cherry');
    const preview = document.querySelector('.editor-draft-panel--active .cherry-previewer');
    const aiBtn = document.querySelector('.editor-draft-panel--active .ai-format__btn');
    return Boolean(cherry && preview && aiBtn);
  });
  if (!cherryOk) {
    throw new Error('Cherry 分栏编辑器或 AI 行未就绪');
  }
  console.log('OK: Cherry Markdown — 分栏编辑区已加载');

  const toolbar = page.locator('.editor-draft-panel--active .cherry-toolbar');
  if ((await toolbar.count()) < 1) {
    throw new Error('Cherry 工具栏未渲染');
  }
  console.log('OK: Cherry Markdown — 内置工具栏可用');

  await browser.close();
}

run().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
