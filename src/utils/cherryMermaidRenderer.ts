/** Cherry 内置 Mermaid 引擎共用离屏 canvas，多段 ```mermaid 时后渲染会清空容器导致只显示一张图 */

type MermaidApi = {
  initialize: (options: Record<string, unknown>) => void;
  render: (
    id: string,
    text: string,
    cb?: (svg: string) => void,
    container?: HTMLElement
  ) => string | void;
};

type CherryEngineHost = {
  $cherry?: { wrapperDom?: HTMLElement };
};

function getMermaidApi(): MermaidApi | null {
  const win = window as unknown as { mermaid?: { mermaidAPI?: MermaidApi } };
  return win.mermaid?.mermaidAPI ?? null;
}

function injectSvgFallback(svg: string): string {
  return svg.replace('<svg ', '<svg style="max-width:100%;height:auto;font-family:sans-serif;" ');
}

function convertMermaidSvg(svgCode: string, graphId: string, svg2img: boolean): string {
  try {
    const doc = new DOMParser().parseFromString(svgCode, 'image/svg+xml');
    const svgDom = doc.documentElement;
    if (svgDom.tagName.toLowerCase() !== 'svg') {
      return injectSvgFallback(svgCode);
    }
    svgDom.setAttribute('style', 'max-width:100%;height:auto;font-family:sans-serif;');
    const shadowSvg = document.getElementById(graphId);
    if (shadowSvg && 'getBBox' in shadowSvg && typeof shadowSvg.getBBox === 'function') {
      const svgBox = (shadowSvg as unknown as SVGGraphicsElement).getBBox();
      if (!svgDom.hasAttribute('viewBox')) {
        svgDom.setAttribute('viewBox', `0 0 ${svgBox.width} ${svgBox.height}`);
      }
    }
    const outer = doc.documentElement.outerHTML;
    if (svg2img) {
      const dataUrl = `data:image/svg+xml,${encodeURIComponent(outer)}`;
      return `<img class="svg-img" src="${dataUrl}" alt="${graphId}" />`;
    }
    return outer;
  } catch {
    return injectSvgFallback(svgCode);
  }
}

function fixMermaidSvg(svgCode: string): string {
  return svgCode
    .replace(/\s*markerUnits="0"/g, '')
    .replace(/\s*x="NaN"/g, '')
    .replace(/<br>/g, '<br/>');
}

/** 与 Cherry MermaidCodeEngine 兼容：每段图单独离屏容器，避免互相覆盖 */
export class CherryMermaidEngine {
  static readonly TYPE = 'figure';

  private readonly mermaidAPI: MermaidApi;
  private svg2img = false;

  constructor(mermaidOptions: Record<string, unknown> = {}) {
    const api = getMermaidApi();
    if (!api) {
      throw new Error('Mermaid API not found. Ensure cherry-markdown.js is loaded.');
    }
    this.mermaidAPI = api;
    const opts = { ...mermaidOptions };
    delete opts.mermaid;
    delete opts.mermaidAPI;
    this.mermaidAPI.initialize({
      theme: 'default',
      startOnLoad: false,
      sequence: { useMaxWidth: false },
      logLevel: 5,
      ...opts,
    });
  }

  render(
    src: string,
    sign: string,
    $engine: CherryEngineHost,
    config: { svg2img?: boolean } = {}
  ): string | undefined {
    const host = $engine?.$cherry?.wrapperDom ?? document.body;
    const container = document.createElement('div');
    container.style.cssText =
      'width:1024px;opacity:0;position:fixed;top:100%;left:-9999px;pointer-events:none;';
    host.appendChild(container);

    const graphId = `mermaid-${sign}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.svg2img = config.svg2img ?? false;

    try {
      let html: string | undefined;
      const onSvg = (svgCode: string) => {
        html = convertMermaidSvg(fixMermaidSvg(svgCode), graphId, this.svg2img);
      };
      const returned = this.mermaidAPI.render(graphId, src, onSvg, container);
      if (!html && typeof returned === 'string' && returned.length > 0) {
        html = convertMermaidSvg(fixMermaidSvg(returned), graphId, this.svg2img);
      }
      return html;
    } catch (e) {
      return (e as { str?: string })?.str;
    } finally {
      container.remove();
    }
  }
}

let sharedEngine: CherryMermaidEngine | null = null;

/** Cherry 构造选项：覆盖内置单例 Mermaid 渲染器 */
export function getCherryMermaidRendererConfig(isDark: boolean): {
  engine: { syntax: { codeBlock: { customRenderer: { mermaid: CherryMermaidEngine } } } };
} | null {
  if (!getMermaidApi()) return null;
  sharedEngine = new CherryMermaidEngine({
    theme: isDark ? 'dark' : 'default',
    sequence: { useMaxWidth: false },
    startOnLoad: false,
  });
  return {
    engine: {
      syntax: {
        codeBlock: {
          customRenderer: {
            mermaid: sharedEngine,
          },
        },
      },
    },
  };
}
