import { getCherryThemeSettings } from '@/utils/cherryEditorTheme';
import {
  ensureMermaidTheme,
  patchCherryBuiltinMermaidEngine,
} from '@/utils/cherryMermaidRenderer';
import { loadCherryMarkdown, type CherryConstructor } from '@/utils/cherryMarkdownLoader';

let renderQueue: Promise<void> = Promise.resolve();

/** 串行化离屏 Cherry 渲染，避免并发 destroy 冲突 */
function enqueueCherryRender<T>(fn: () => Promise<T>): Promise<T> {
  const run = renderQueue.then(fn);
  renderQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/** 用 Cherry 引擎渲染整段 Markdown（含 Mermaid），与编辑预览一致 */
export function renderMarkdownWithCherryHtml(markdown: string): Promise<string> {
  return enqueueCherryRender(async () => {
    const Cherry: CherryConstructor = await loadCherryMarkdown();
    patchCherryBuiltinMermaidEngine();
    ensureMermaidTheme(
      document.documentElement.dataset.themeMode === 'dark' ? 'dark' : 'default'
    );

    const hostId = `cherry-read-${Math.random().toString(36).slice(2, 9)}`;
    const host = document.createElement('div');
    host.id = hostId;
    host.style.cssText =
      'position:fixed;left:-9999px;top:0;width:min(920px,100vw);opacity:0;pointer-events:none;';
    document.body.appendChild(host);

    try {
      const cherry = new Cherry({
        id: hostId,
        value: markdown,
        isPreviewOnly: true,
        editor: {
          defaultModel: 'previewOnly',
          height: 'auto',
        },
        themeSettings: getCherryThemeSettings(),
      });
      const html = cherry.getHtml?.(false) ?? '';
      cherry.destroy();
      return html;
    } finally {
      host.remove();
    }
  });
}
