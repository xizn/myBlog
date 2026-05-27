import { loadCherryMarkdown } from '@/utils/cherryMarkdownLoader';

import { renderMarkdownWithCherryHtml } from '@/utils/cherryMarkdownHtml';

import {
  MERMAID_OFFSCREEN_CONTAINER_STYLE,
  ensureMermaidExportTheme,
  renderMermaidSvgHtmlAsync,
  warmMermaidDiagramEngine,
} from '@/utils/cherryMermaidRenderer';
import {
  isMermaidLanguage,
  looksLikeMermaidSource,
  normalizeMermaidSourceForExport,
} from '@/utils/mermaidDetect';



/** 导出用内部标记（非用户可见图注，仅用于识别 Mermaid 栅格图） */
export const MERMAID_EXPORT_IMAGE_ALT = '__mermaid_diagram__';

const MAX_EXPORT_DIAGRAM_WIDTH = 1600;
const SVG_EXPORT_PADDING_PX = 12;
/** 2x 栅格，避免 Word/PDF 放大发糊 */
const EXPORT_DIAGRAM_PIXEL_RATIO = 2;



type MermaidFence = { index: number; length: number; lang: string; code: string };



/** 识别所有 Mermaid / flow / graph 代码块（含无语言标记但内容为 graph） */

function findMermaidFences(markdown: string): MermaidFence[] {

  const fences: MermaidFence[] = [];

  const re = /```([^\n`]*)\r?\n([\s\S]*?)```/g;

  let m: RegExpExecArray | null;

  while ((m = re.exec(markdown)) !== null) {

    const lang = (m[1] ?? '').trim();

    const code = m[2] ?? '';

    const langOnly = lang.split(/\s+/)[0] ?? '';

    if (

      isMermaidLanguage(langOnly) ||

      isMermaidLanguage(lang) ||

      /^graph\b/i.test(langOnly) ||

      looksLikeMermaidSource(code)

    ) {

      fences.push({

        index: m.index,

        length: m[0].length,

        lang: langOnly || lang || 'mermaid',

        code,

      });

    }

  }

  return fences;

}



function markdownStillHasMermaidFences(markdown: string): boolean {
  return findMermaidFences(markdown).length > 0;
}

function mountSvgForMeasure(svg: SVGSVGElement): { host: HTMLDivElement; mounted: SVGSVGElement } {
  const host = document.createElement('div');
  host.style.cssText = MERMAID_OFFSCREEN_CONTAINER_STYLE;
  document.body.appendChild(host);
  const mounted = svg.cloneNode(true) as SVGSVGElement;
  host.appendChild(mounted);
  return { host, mounted };
}

/** 收紧 viewBox，去掉 Mermaid 多余留白（Word 选区不会过宽） */
function tightenSvgViewBox(svg: SVGSVGElement): SVGSVGElement {
  const { host, mounted } = mountSvgForMeasure(svg);
  try {
    const box = mounted.getBBox();
    if (box.width <= 0 || box.height <= 0) return svg;
    const pad = SVG_EXPORT_PADDING_PX;
    const x = box.x - pad;
    const y = box.y - pad;
    const w = box.width + pad * 2;
    const h = box.height + pad * 2;
    const out = svg.cloneNode(true) as SVGSVGElement;
    out.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    out.setAttribute('width', String(Math.ceil(w)));
    out.setAttribute('height', String(Math.ceil(h)));
    out.removeAttribute('style');
    return out;
  } catch {
    return svg;
  } finally {
    host.remove();
  }
}

function resolveSvgLayoutSize(svg: SVGSVGElement): { width: number; height: number } {
  const attrW = parseFloat(svg.getAttribute('width') ?? '');
  const attrH = parseFloat(svg.getAttribute('height') ?? '');
  if (Number.isFinite(attrW) && attrW > 0 && Number.isFinite(attrH) && attrH > 0) {
    return { width: Math.ceil(attrW), height: Math.ceil(attrH) };
  }
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { width: Math.ceil(vb.width), height: Math.ceil(vb.height) };
  }
  return { width: 480, height: 320 };
}

function clampDiagramExportSize(width: number, height: number): { width: number; height: number } {
  let w = Math.max(1, Math.round(width));
  let h = Math.max(1, Math.round(height));
  if (w > MAX_EXPORT_DIAGRAM_WIDTH) {
    h = Math.round((h * MAX_EXPORT_DIAGRAM_WIDTH) / w);
    w = MAX_EXPORT_DIAGRAM_WIDTH;
  }
  return { width: w, height: h };
}

function rasterizeLoadedImage(
  img: HTMLImageElement,
  layoutWidth: number,
  layoutHeight: number
): string | null {
  const layoutW = Math.max(layoutWidth, img.naturalWidth || 0);
  const layoutH = Math.max(layoutHeight, img.naturalHeight || 0);
  const { width, height } = clampDiagramExportSize(layoutW, layoutH);
  const ratio = EXPORT_DIAGRAM_PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

async function rasterizeSvgElement(svg: SVGSVGElement): Promise<string | null> {
  const tight = tightenSvgViewBox(svg);
  const layout = resolveSvgLayoutSize(tight);
  const xml = new XMLSerializer().serializeToString(tight);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg load failed'));
      img.src = url;
    });
    return rasterizeLoadedImage(img, layout.width, layout.height);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterizeDataUrl(src: string): Promise<string | null> {
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img load failed'));
      img.src = src;
    });
    return rasterizeLoadedImage(img, img.naturalWidth || 800, img.naturalHeight || 480);
  } catch {
    return null;
  }
}



/** 将 Mermaid 渲染结果（figure/svg 或 data-url img）转为 PNG data URL */

export async function diagramHtmlToPngDataUrl(html: string): Promise<string | null> {

  if (!html?.trim()) return null;

  const host = document.createElement('div');

  host.style.cssText = 'position:fixed;left:-9999px;top:0;';

  host.innerHTML = html;

  document.body.appendChild(host);

  try {

    const svg = host.querySelector('svg');

    if (svg) return rasterizeSvgElement(svg);

    const img = host.querySelector('img');

    if (img?.src) return rasterizeDataUrl(img.src);

    return null;

  } finally {

    host.remove();

  }

}



async function ensureMermaidReadyForExport(): Promise<void> {

  await loadCherryMarkdown();

  ensureMermaidExportTheme();

  await warmMermaidDiagramEngine();

}



async function fenceToPngDataUrl(fence: MermaidFence): Promise<string | null> {

  const code = normalizeMermaidSourceForExport(fence.code, fence.lang);

  const html = await renderMermaidSvgHtmlAsync(code, `export-${fence.index}`, document.body, {

    svg2img: false,

  });

  if (!html) return null;

  return diagramHtmlToPngDataUrl(html);

}



function applyFenceReplacements(

  markdown: string,

  fences: MermaidFence[],

  dataUrls: (string | null)[]

): string {

  let out = markdown;

  for (let i = fences.length - 1; i >= 0; i--) {

    const dataUrl = dataUrls[i];

    if (!dataUrl) continue;

    const fence = fences[i]!;

    const replacement = `\n\n![${MERMAID_EXPORT_IMAGE_ALT}](${dataUrl})\n\n`;

    out = out.slice(0, fence.index) + replacement + out.slice(fence.index + fence.length);

  }

  return out;

}



/** 兜底：Cherry getHtml 已渲染的 figure/svg 按顺序替换围栏 */

async function replaceMermaidViaCherryHtml(markdown: string, fences: MermaidFence[]): Promise<string> {

  if (fences.length === 0) return markdown;

  const html = await renderMarkdownWithCherryHtml(markdown);

  const host = document.createElement('div');

  host.innerHTML = html;

  const figures = [...host.querySelectorAll('figure')].filter(

    (fig) => fig.querySelector('svg') || fig.querySelector('img.svg-img, img[src^="data:image"]')

  );

  if (figures.length === 0) return markdown;



  const dataUrls: (string | null)[] = [];

  for (let i = 0; i < fences.length; i++) {

    const fig = figures[i] ?? figures[figures.length - 1];

    if (!fig) {

      dataUrls.push(null);

      continue;

    }

    const figHtml = fig.outerHTML;

    dataUrls.push(await diagramHtmlToPngDataUrl(figHtml));

  }

  return applyFenceReplacements(markdown, fences, dataUrls);

}



/** 导出前：把 Mermaid / flow / graph 代码块替换为内嵌 PNG 图片 */

export async function replaceMermaidFencesWithImages(markdown: string): Promise<string> {

  const fences = findMermaidFences(markdown);

  if (fences.length === 0) return markdown;



  await ensureMermaidReadyForExport();



  const dataUrls: (string | null)[] = [];
  for (const fence of fences) {
    dataUrls.push(await fenceToPngDataUrl(fence));
  }

  let out = applyFenceReplacements(markdown, fences, dataUrls);



  if (markdownStillHasMermaidFences(out)) {

    out = await replaceMermaidViaCherryHtml(out, findMermaidFences(out));

  }

  return out;

}


