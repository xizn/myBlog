/**
 * 用用户样例 Markdown 验证：围栏识别 + renderAsync + PNG 替换
 * 运行：node scripts/verify-export-mermaid-user.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendorJs = join(root, 'public/vendor/cherry-markdown/cherry-markdown.js');

const USER_MD = `FlowChart
左右结构
\`\`\`mermaid
graph LR
A[公司] -->| 下 班 | B(菜市场)
B --> C{看见<br>卖西瓜的}
C -->|Yes| D[买一个包子]
C -->|No| E[买一斤包子]
\`\`\`
上下结构
\`\`\`mermaid
graph TD
A[公司] -->| 下 班 | B(菜市场)
B --> C{看见<br>卖西瓜的}
C -->|Yes| D[买一个包子]
C -->|No| E[买一斤包子]
\`\`\``;

if (!existsSync(vendorJs)) {
  console.error('Missing cherry-markdown.js');
  process.exit(1);
}

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/test.html' : req.url;
  if (url === '/test.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><body><script src="/cherry-markdown.js"></script></body>');
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

  const result = await page.evaluate(async (markdown) => {
    const re = /```([^\n`]*)\r?\n([\s\S]*?)```/g;
    const fences = [];
    let m;
    while ((m = re.exec(markdown)) !== null) {
      const lang = (m[1] ?? '').trim().toLowerCase();
      if (lang === 'mermaid' || lang.startsWith('mermaid')) {
        fences.push({ code: (m[2] ?? '').trim(), index: m.index, length: m[0].length });
      }
    }
    const api =
      window.Cherry.config.defaults.engine.syntax.codeBlock.customRenderer.mermaid.mermaidAPIRefs;
    api.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: { htmlLabels: false },
    });
    const norm = (code) => code.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');

    const warmHost = document.createElement('div');
    warmHost.style.cssText =
      'position:fixed;left:0;top:0;width:1280px;min-height:720px;visibility:hidden;overflow:hidden;pointer-events:none;z-index:-1;';
    document.body.appendChild(warmHost);
    await api.renderAsync('warmup', 'graph TD;\nA-->B', undefined, warmHost);
    warmHost.remove();

    async function toPng(code, sign) {
      const host = document.createElement('div');
      host.style.cssText =
        'position:fixed;left:0;top:0;width:1280px;min-height:720px;visibility:hidden;overflow:hidden;pointer-events:none;z-index:-1;';
      document.body.appendChild(host);
      try {
        const raw = await api.renderAsync(`exp-${sign}`, code, undefined, host);
        if (!raw || !raw.includes('<svg')) return null;
        const wrap = document.createElement('div');
        wrap.innerHTML = raw.includes('<svg') ? raw : `<div>${raw}</div>`;
        const svg = wrap.querySelector('svg');
        if (!svg) return null;
        const xml = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('img'));
          img.src = url;
        });
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(960, img.naturalWidth || 800);
        canvas.height = Math.round(
          ((img.naturalHeight || 480) * canvas.width) / (img.naturalWidth || 800)
        );
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
      } finally {
        host.remove();
      }
    }

    let out = markdown;
    const urls = [];
    for (let i = 0; i < fences.length; i++) {
      const png = await toPng(norm(fences[i].code), i);
      urls.push(png);
    }
    for (let i = fences.length - 1; i >= 0; i--) {
      if (!urls[i]) continue;
      const f = fences[i];
      const rep = `\n\n![流程图](${urls[i]})\n\n`;
      out = out.slice(0, f.index) + rep + out.slice(f.index + f.length);
    }
    return {
      fenceCount: fences.length,
      pngOk: urls.filter(Boolean).length,
      stillHasFence: /```mermaid/.test(out),
      sampleLine: out.split('\n').find((l) => l.startsWith('!['))?.slice(0, 80) ?? '',
    };
  }, USER_MD);

  console.log(result);
  if (result.fenceCount !== 2) throw new Error(`expected 2 fences, got ${result.fenceCount}`);
  if (result.pngOk !== 2) throw new Error(`expected 2 png, got ${result.pngOk}`);
  if (result.stillHasFence) throw new Error('mermaid fences still in output');
  console.log('OK: user sample mermaid export raster');
} finally {
  await browser.close();
  server.close();
}
