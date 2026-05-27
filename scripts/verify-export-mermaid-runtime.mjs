/**
 * 浏览器内验证 Mermaid renderAsync 可产出 SVG（导出栅格化依赖此能力）
 * 运行：node scripts/verify-export-mermaid-runtime.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendorJs = join(root, 'public/vendor/cherry-markdown/cherry-markdown.js');

if (!existsSync(vendorJs)) {
  console.error('Missing cherry-markdown.js vendor bundle');
  process.exit(1);
}

const mime = {
  '.js': 'application/javascript',
  '.html': 'text/html',
};

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/test.html' : req.url;
  if (url === '/test.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!doctype html><body><script src="/cherry-markdown.js"></script></body>`);
    return;
  }
  if (url === '/cherry-markdown.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(readFileSync(vendorJs));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto(`http://127.0.0.1:${port}/test.html`, { waitUntil: 'load' });
  await page.waitForFunction(
    () =>
      window.Cherry?.config?.defaults?.engine?.syntax?.codeBlock?.customRenderer?.mermaid
        ?.mermaidAPIRefs?.renderAsync,
    { timeout: 60000 }
  );

  const ok = await page.evaluate(async () => {
    const api =
      window.Cherry?.config?.defaults?.engine?.syntax?.codeBlock?.customRenderer?.mermaid
        ?.mermaidAPIRefs;
    if (!api?.renderAsync) return false;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(host);
    try {
      api.initialize({ startOnLoad: false, theme: 'default' });
      const raw = await api.renderAsync(
        `rt-${Date.now()}`,
        'graph LR\n  A[开始] --> B[结束]',
        undefined,
        host
      );
      return typeof raw === 'string' && raw.includes('<svg');
    } finally {
      host.remove();
    }
  });

  if (!ok) {
    throw new Error('renderAsync did not return SVG markup');
  }
  console.log('OK: mermaid renderAsync produces SVG (export raster prerequisite)');
} finally {
  await browser.close();
  server.close();
}
