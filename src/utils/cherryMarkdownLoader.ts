/** 从 public/vendor/cherry-markdown 加载 IndexDoc 同款 Cherry Markdown（源自 indexdoc-editor-main） */

const CHERRY_CSS = '/vendor/cherry-markdown/cherry-markdown.css';
const CHERRY_JS = '/vendor/cherry-markdown/cherry-markdown.js';

export type CherryConstructor = new (options: Record<string, unknown>) => CherryInstance;

export interface CherryPreviewerApi {
  scrollToLineNum: (lineNum: number | null, linePercent?: number) => void;
  scrollToTop?: (scrollTop: number, behavior?: 'auto' | 'smooth' | 'instant') => void;
  highlightLine?: (lineNum: number) => void;
  setRealLayout?: (editorPct?: string, previewerPct?: string) => void;
  syncVirtualLayoutFromReal?: () => void;
}

export interface CherryInstance {
  getMarkdown(): string;
  setMarkdown(content: string, keepCursor?: boolean): void;
  destroy(): void;
  setTheme?: (theme: string) => void;
  previewer?: CherryPreviewerApi;
}

let loadPromise: Promise<CherryConstructor> | null = null;

function injectStylesheet(href: string): void {
  if (document.querySelector(`link[data-cherry-css="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.cherryCss = href;
  document.head.appendChild(link);
}

function injectScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[data-cherry-js="${src}"]`);
  if (existing) {
    return (existing as HTMLScriptElement).dataset.loaded === '1'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
        });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.cherryJs = src;
    script.onload = () => {
      script.dataset.loaded = '1';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

/** 加载 Cherry 构造函数（全局由 UMD 注入） */
export function loadCherryMarkdown(): Promise<CherryConstructor> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    injectStylesheet(CHERRY_CSS);
    await injectScript(CHERRY_JS);
    const Cherry = (window as unknown as { Cherry?: CherryConstructor }).Cherry;
    if (!Cherry) {
      throw new Error('Cherry Markdown 未加载，请确认 public/vendor/cherry-markdown 资源存在');
    }
    return Cherry;
  })();

  return loadPromise;
}
