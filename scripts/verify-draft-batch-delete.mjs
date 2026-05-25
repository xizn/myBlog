/**
 * 验证草稿箱批量删除（需先 npm run dev）
 * node scripts/verify-draft-batch-delete.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';
const STORAGE_KEY = 'myblog_agent_drafts';

const seedDrafts = [
  {
    draftId: 'batch-test-a',
    title: '批量删-A',
    summary: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    data: { id: '', title: '批量删-A', summary: '', description: '', tags: '', status: 'active', repoUrl: '', previewUrl: '', previewType: 'none', featured: false },
    operations: [],
  },
  {
    draftId: 'batch-test-b',
    title: '批量删-B',
    summary: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    data: { id: '', title: '批量删-B', summary: '', description: '', tags: '', status: 'active', repoUrl: '', previewUrl: '', previewType: 'none', featured: false },
    operations: [],
  },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/agents`, { waitUntil: 'networkidle' });
  await page.evaluate(
    ([key, drafts]) => localStorage.setItem(key, JSON.stringify(drafts)),
    [STORAGE_KEY, seedDrafts]
  );
  await page.reload({ waitUntil: 'networkidle' });

  const section = page.locator('.draft-box');
  await section.getByText('批量删-A').waitFor({ timeout: 10000 });

  await section.getByRole('button', { name: '多选删除' }).click();
  await section.locator('.draft-box__select-all input').check();
  await section.getByRole('button', { name: '删除选中' }).click();
  await page.getByRole('heading', { name: '批量删除草稿' }).waitFor();
  await page.getByRole('button', { name: '确认删除' }).click();
  await page.waitForTimeout(400);

  const remaining = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    return list.filter((d) => d.draftId.startsWith('batch-test-')).length;
  }, STORAGE_KEY);

  if (remaining !== 0) {
    throw new Error(`批量删除后仍剩 ${remaining} 条测试草稿`);
  }

  await expectEmptyOrNoTestDrafts(page, section);
  console.log('OK: Agent 草稿箱批量删除');
  await browser.close();
}

async function expectEmptyOrNoTestDrafts(page, section) {
  const visible = await section.getByText('批量删-A').count();
  if (visible > 0) throw new Error('列表仍显示已删草稿');
}

run().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
