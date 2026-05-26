import type { CherryInstance } from '@/utils/cherryMarkdownLoader';
import {
  MARKDOWN_IMAGE_INLINE_RE,
  stripCherryImageAlt,
} from '@/utils/markdownImageData';

type DataImageMatch = {
  full: string;
  alt: string;
  src: string;
  index: number;
};

type PreviewerBubbleApi = {
  imgIndex: number;
  imgAppend: string | false;
  beginChangeImgValue: (htmlElement: HTMLImageElement) => boolean;
  changeImgValue: (htmlElement: HTMLImageElement, style: { width: string; height: string }) => void;
  bubbleHandler?: { click?: { $isResizing?: () => boolean } };
};

type CherryWithPreviewer = CherryInstance & {
  previewer?: { previewerBubble?: PreviewerBubbleApi };
};

/** 含损坏 URL 的 base64 图片（缩放时 #px 可能插入 mime 段） */
const DATA_IMAGE_LOOSE_RE =
  /!\[([^\]]*)\]\((data:image\/[^)]*?;base64,[A-Za-z0-9+/=]+)\)/gi;

/** 图片 markdown 闭括号后误入的 HTML 碎片 */
const DATA_IMAGE_HTML_LEAK_RE =
  /\)(?:[^!\n\r]*?(?:box-shadow|cherry-img|class\s*=|style\s*=|alt\s*=|<\/img|\/?>\s*))/gi;

function listDataImageMatches(content: string): DataImageMatch[] {
  const items: DataImageMatch[] = [];
  const tryMatch = (re: RegExp) => {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      items.push({
        full: match[0]!,
        alt: match[1]!,
        src: match[2]!,
        index: match.index!,
      });
    }
  };
  const needsLoose = /data:image\/[^;\)]*#/i.test(content);
  if (needsLoose) {
    tryMatch(new RegExp(DATA_IMAGE_LOOSE_RE.source, DATA_IMAGE_LOOSE_RE.flags));
  } else {
    tryMatch(new RegExp(MARKDOWN_IMAGE_INLINE_RE.source, MARKDOWN_IMAGE_INLINE_RE.flags));
    if (items.length === 0) {
      tryMatch(new RegExp(DATA_IMAGE_LOOSE_RE.source, DATA_IMAGE_LOOSE_RE.flags));
    }
  }
  return items;
}

/** 修复被插入 #px 标记的 data URL，如 data:image/pn#172px #63px #Sg;base64,... */
export function repairDataImageUrl(url: string): string {
  const m = url.match(/^data:image\/([^;]*);base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) return url;

  let mime = m[1]!.replace(/#[^\s#]*/g, '').replace(/\s+/g, '').toLowerCase();
  if (mime === 'pn' || mime.startsWith('pn')) mime = 'png';
  else if (mime === 'jp' || mime === 'jpe') mime = 'jpeg';
  else if (!/^[a-z0-9+.-]{2,12}$/.test(mime)) mime = 'png';

  return `data:image/${mime};base64,${m[2]}`;
}

function base64Payload(url: string): string | null {
  const m = url.match(/;base64,([A-Za-z0-9+/=]+)$/i);
  return m?.[1] ?? null;
}

function dataUrlsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const pa = base64Payload(a);
  const pb = base64Payload(b);
  return Boolean(pa && pb && pa === pb);
}

/** 从 alt 提取对齐/阴影等 Cherry 样式标记（不含尺寸） */
export function extractCherryStyleFlags(alt: string): string[] {
  const flags = new Set<string>();
  const re = /#([a-z-]+|[BSR])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(alt)) !== null) {
    if (m[1]!.toLowerCase() === 'auto') continue;
    flags.add(m[1]!);
  }
  return [...flags];
}

function buildCherryImageAlt(
  label: string,
  widthPx: number,
  heightPx: number,
  flags: string[]
): string {
  let alt = `${label}#${widthPx}px #${heightPx}px`;
  for (const f of flags) alt += ` #${f}`;
  return alt;
}

/** 规范化 base64 图片的 Cherry alt（去重尺寸标记） */
export function normalizeCherryDataImageAlt(alt: string): string {
  const px = [...alt.matchAll(/#(\d+)px/gi)].map((m) => parseInt(m[1]!, 10));
  const widthPx = px.length >= 2 ? px[px.length - 2] : px.length === 1 ? px[0] : undefined;
  const heightPx = px.length >= 2 ? px[px.length - 1] : undefined;
  const pct = [...alt.matchAll(/#(\d+)%/gi)].map((m) => m[0]);
  const label = stripCherryImageAlt(alt) || 'image';
  const flags = extractCherryStyleFlags(alt);

  if (widthPx !== undefined && heightPx !== undefined) {
    return buildCherryImageAlt(label, widthPx, heightPx, flags);
  }
  let result = label;
  if (widthPx !== undefined) result += `#${widthPx}px`;
  if (pct.length) result += ` ${pct[pct.length - 1]}`;
  for (const f of flags) result += ` #${f}`;
  return result;
}

/** 修复 Cherry 拖拽改尺寸后 base64 图片 markdown 被破坏的问题 */
export function sanitizeCherryDataImageMarkdown(content: string): string {
  if (!content.includes('data:image/')) return content;

  let out = content.replace(DATA_IMAGE_HTML_LEAK_RE, ')');
  const images = listDataImageMatches(out);
  if (images.length === 0) return out;

  let cursor = 0;
  let rebuilt = '';
  for (const img of images) {
    rebuilt += out.slice(cursor, img.index);
    const src = repairDataImageUrl(img.src);
    const alt = normalizeCherryDataImageAlt(img.alt);
    rebuilt += `![${alt}](${src})`;
    cursor = img.index + img.full.length;
  }
  rebuilt += out.slice(cursor);
  return rebuilt;
}

function replaceDataImageSizeInMarkdown(
  content: string,
  imgIndex: number,
  dataSrc: string,
  width: number,
  height: number
): string {
  const base = sanitizeCherryDataImageMarkdown(content);
  const images = listDataImageMatches(base);
  if (images.length === 0) return base;

  let idx = imgIndex;
  if (!dataUrlsMatch(images[idx]?.src ?? '', dataSrc)) {
    idx = images.findIndex((item) => dataUrlsMatch(item.src, dataSrc));
  }
  if (idx < 0) return base;

  const img = images[idx]!;
  const label = stripCherryImageAlt(img.alt) || 'image';
  const flags = extractCherryStyleFlags(img.alt);
  const src = repairDataImageUrl(dataSrc);
  const newFull = `![${buildCherryImageAlt(label, width, height, flags)}](${src})`;
  return base.slice(0, img.index) + newFull + base.slice(img.index + img.full.length);
}

function isImgResizing(cherry: CherryInstance): boolean {
  const handler = (cherry as CherryWithPreviewer).previewer?.previewerBubble?.bubbleHandler?.click;
  return Boolean(handler?.$isResizing?.());
}

/**
 * Cherry 对 base64 超长行用 replaceSelection 改尺寸会破坏 URL；
 * 改为：拖拽时只动预览 CSS，松手后整段替换 markdown。
 */
export function patchCherryDataImageResize(cherry: CherryInstance): void {
  const bubble = (cherry as CherryWithPreviewer).previewer?.previewerBubble;
  if (!bubble) return;

  const originalBegin = bubble.beginChangeImgValue.bind(bubble);
  const originalChange = bubble.changeImgValue.bind(bubble);

  bubble.beginChangeImgValue = (htmlElement: HTMLImageElement) => {
    const src = htmlElement.getAttribute('src') ?? '';
    if (!src.startsWith('data:image/')) {
      return originalBegin(htmlElement);
    }
    bubble.imgAppend = false;
    return true;
  };

  bubble.changeImgValue = (htmlElement: HTMLImageElement, style: { width: string; height: string }) => {
    const src = htmlElement.getAttribute('src') ?? '';
    if (!src.startsWith('data:image/')) {
      originalChange(htmlElement, style);
      return;
    }
    if (isImgResizing(cherry)) {
      return;
    }

    const width = Math.round(parseFloat(style.width));
    const height = Math.round(parseFloat(style.height));
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;

    const current = cherry.getMarkdown();
    const next = replaceDataImageSizeInMarkdown(current, bubble.imgIndex, src, width, height);
    if (next !== current) {
      cherry.setMarkdown(next, true);
    }
  };
}
