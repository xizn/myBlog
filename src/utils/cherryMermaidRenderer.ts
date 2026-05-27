/** Cherry / 阅读页共用：Mermaid 渲染（每段图独立离屏容器，避免多图互相覆盖） */

/** 须参与文档布局（含 getBoundingClientRect），不能用 left:-9999px */
export const MERMAID_OFFSCREEN_CONTAINER_STYLE =
  'position:fixed;left:0;top:0;width:1280px;min-height:720px;visibility:hidden;overflow:hidden;pointer-events:none;z-index:-1;';



import { isAppDarkTheme } from '@/utils/cherryEditorTheme';



type MermaidApi = {

  initialize: (options: Record<string, unknown>) => void;

  render: (

    id: string,

    text: string,

    cb?: (svg: string) => void,

    container?: HTMLElement

  ) => string | void;

  renderAsync?: (

    id: string,

    text: string,

    cb?: (svg: string) => void,

    container?: HTMLElement

  ) => Promise<string>;

};



type MermaidWindow = Window & {

  mermaid?: {

    mermaidAPI?: MermaidApi;

    renderAsync?: MermaidApi['renderAsync'];

  };

};



type MermaidEngineLike = {

  mermaidAPIRefs?: MermaidApi;

  mermaidCanvas?: HTMLElement | null;

  options?: Record<string, unknown>;

  svg2img?: boolean;

  render?: (

    src: string,

    sign: string,

    $engine: { $cherry?: { wrapperDom?: HTMLElement } },

    config?: { svg2img?: boolean }

  ) => string | undefined;

};



/** Cherry UMD 将 mermaid 打进包内，不挂 window；从 MermaidCodeEngine 取 API */
function getMermaidApi(): MermaidApi | null {
  const engine = getBuiltinMermaidEngine();
  if (engine?.mermaidAPIRefs) return engine.mermaidAPIRefs;
  return (window as MermaidWindow).mermaid?.mermaidAPI ?? null;
}

function getMermaidRenderAsync(): MermaidApi['renderAsync'] | null {
  const api = getMermaidApi();
  if (api?.renderAsync) return api.renderAsync.bind(api);
  const win = window as MermaidWindow;
  const top = win.mermaid?.renderAsync ?? win.mermaid?.mermaidAPI?.renderAsync;
  return top ? top.bind(win.mermaid?.mermaidAPI ?? win.mermaid) : null;
}



type CherryWindow = Window & {

  Cherry?: {

    config?: {

      defaults?: {

        engine?: {

          syntax?: {

            codeBlock?: { customRenderer?: { mermaid?: MermaidEngineLike } };

          };

        };

      };

    };

  };

};



function getBuiltinMermaidEngine(): MermaidEngineLike | null {

  const Cherry = (window as unknown as CherryWindow).Cherry;

  return Cherry?.config?.defaults?.engine?.syntax?.codeBlock?.customRenderer?.mermaid ?? null;

}



function injectSvgFallback(svg: string): string {

  return svg.replace('<svg ', '<svg style="max-width:100%;height:auto;font-family:sans-serif;" ');

}



function fixMermaidSvg(svgCode: string): string {

  return svgCode

    .replace(/\s*markerUnits="0"/g, '')

    .replace(/\s*x="NaN"/g, '')

    .replace(/<br>/g, '<br/>');

}



function pickSvgMarkup(raw: string): string {

  const trimmed = raw.trim();

  if (!trimmed) return trimmed;

  if (trimmed.startsWith('<svg')) return trimmed;

  try {

    const doc = new DOMParser().parseFromString(trimmed, 'text/html');

    const svg = doc.querySelector('svg');

    if (svg) return svg.outerHTML;

  } catch {

    /* ignore */

  }

  return trimmed;

}



function finalizeMermaidSvg(svgCode: string, svg2img: boolean, graphId: string): string {

  const fixed = fixMermaidSvg(pickSvgMarkup(svgCode));

  if (!fixed.includes('<svg')) {

    return injectSvgFallback(fixed);

  }

  try {

    const doc = new DOMParser().parseFromString(fixed, 'image/svg+xml');

    const svgDom = doc.documentElement;

    if (svgDom.tagName.toLowerCase() !== 'svg') {

      return injectSvgFallback(fixed);

    }

    svgDom.setAttribute('style', 'max-width:100%;height:auto;font-family:sans-serif;');

    const outer = doc.documentElement.outerHTML;

    if (svg2img) {

      const dataUrl = `data:image/svg+xml,${encodeURIComponent(outer)}`;

      return `<img class="svg-img" src="${dataUrl}" alt="${graphId}" />`;

    }

    return outer;

  } catch {

    return injectSvgFallback(fixed);

  }

}



/** 异步渲染 Mermaid（Mermaid 10+ 懒加载图类型时必须走 renderAsync） */

export async function renderMermaidSvgHtmlAsync(

  src: string,

  sign: string,

  host: HTMLElement,

  config: { svg2img?: boolean } = {}

): Promise<string | undefined> {

  const renderAsync = getMermaidRenderAsync();

  const api = getMermaidApi();

  if (!renderAsync && !api) return undefined;



  const container = document.createElement('div');

  container.style.cssText = MERMAID_OFFSCREEN_CONTAINER_STYLE;
  host.appendChild(container);



  const graphId = `mermaid-${sign}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const svg2img = config.svg2img ?? false;

  const trimmed = src.trim();



  try {

    if (renderAsync) {

      const raw = await renderAsync(graphId, trimmed, undefined, container);

      if (raw?.trim()) return finalizeMermaidSvg(raw, svg2img, graphId);

      return undefined;

    }



    let html: string | undefined;

    const onSvg = (svgCode: string) => {

      html = finalizeMermaidSvg(svgCode, svg2img, graphId);

    };

    try {

      const returned = api!.render(graphId, trimmed, onSvg, container);

      if (!html && typeof returned === 'string' && returned.length > 0) {

        html = finalizeMermaidSvg(returned, svg2img, graphId);

      }

    } catch (e) {

      if (html) return html;

      const str = (e as { str?: string })?.str;

      if (str) return finalizeMermaidSvg(str, svg2img, graphId);

      return undefined;

    }

    return html;

  } finally {

    container.remove();

  }

}



let mermaidThemeReady = false;

let mermaidThemeMode: 'dark' | 'default' | null = null;

export function ensureMermaidTheme(theme: 'dark' | 'default' = isAppDarkTheme() ? 'dark' : 'default'): void {
  const api = getMermaidApi();
  if (!api) return;
  if (mermaidThemeReady && mermaidThemeMode === theme) return;
  api.initialize({
    theme,
    startOnLoad: false,
    sequence: { useMaxWidth: false },
    logLevel: 5,
  });
  mermaidThemeReady = true;
  mermaidThemeMode = theme;
}

/** 导出专用：白底黑字黑线；SVG 文本标签，避免 foreignObject 导致 PNG 栅格化失败 */
export function ensureMermaidExportTheme(): void {
  const api = getMermaidApi();
  if (!api) return;
  api.initialize({
    theme: 'base',
    themeVariables: {
      background: '#ffffff',
      mainBkg: '#ffffff',
      secondBkg: '#ffffff',
      tertiaryBkg: '#ffffff',
      primaryColor: '#ffffff',
      secondaryColor: '#ffffff',
      tertiaryColor: '#ffffff',
      primaryTextColor: '#000000',
      secondaryTextColor: '#000000',
      tertiaryTextColor: '#000000',
      primaryBorderColor: '#000000',
      secondaryBorderColor: '#000000',
      tertiaryBorderColor: '#000000',
      lineColor: '#000000',
      textColor: '#000000',
      nodeBorder: '#000000',
      clusterBkg: '#ffffff',
      clusterBorder: '#000000',
      titleColor: '#000000',
      edgeLabelBackground: '#ffffff',
      nodeTextColor: '#000000',
    },
    startOnLoad: false,
    sequence: { useMaxWidth: false },
    flowchart: { htmlLabels: false, useMaxWidth: false },
    logLevel: 5,
  });
}



/** 预加载懒注册图类型，避免首段 sync render 抛 promise 错误 */

export async function warmMermaidDiagramEngine(): Promise<void> {

  const renderAsync = getMermaidRenderAsync();

  if (!renderAsync) return;

  const host = document.createElement('div');

  host.style.cssText = MERMAID_OFFSCREEN_CONTAINER_STYLE;
  document.body.appendChild(host);

  try {

    await renderAsync(`mermaid-warmup-${Date.now()}`, 'graph TD;\nA-->B', undefined, host);

  } catch {

    /* 预热失败不阻断导出 */

  } finally {

    host.remove();

  }

}



/** 阅读页：按需加载 Cherry 后渲染 Mermaid */

export async function renderMermaidForReadPage(code: string): Promise<string | null> {

  const { loadCherryMarkdown } = await import('@/utils/cherryMarkdownLoader');

  await loadCherryMarkdown();

  patchCherryBuiltinMermaidEngine();

  ensureMermaidTheme(isAppDarkTheme() ? 'dark' : 'default');

  await warmMermaidDiagramEngine();

  const html = await renderMermaidSvgHtmlAsync(code, 'read', document.body, { svg2img: false });

  return html ?? null;

}



/**

 * 修补 Cherry 内置 Mermaid 引擎：每段 ```mermaid 使用独立离屏容器。

 * 须在 loadCherryMarkdown 之后、new Cherry 之前调用。

 */

export function patchCherryBuiltinMermaidEngine(): void {

  const engine = getBuiltinMermaidEngine();

  if (!engine?.render || (engine as { __multiDiagramPatch?: boolean }).__multiDiagramPatch) {

    return;

  }



  const originalRender = engine.render.bind(engine);

  engine.render = function patchedRender(src, sign, $engine, config) {

    const host = $engine?.$cherry?.wrapperDom ?? document.body;

    const prevCanvas = engine.mermaidCanvas;

    const container = document.createElement('div');

    container.style.cssText = MERMAID_OFFSCREEN_CONTAINER_STYLE;
    host.appendChild(container);

    engine.mermaidCanvas = container;

    try {

      return originalRender(src, sign, $engine, config);

    } finally {

      container.remove();

      engine.mermaidCanvas = prevCanvas ?? null;

    }

  };

  (engine as { __multiDiagramPatch?: boolean }).__multiDiagramPatch = true;

}


