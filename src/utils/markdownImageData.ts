/** Cherry 图片 alt 中的样式标记，如 #S #60% #auto（勿用 \\b 结尾，% 后无词界） */
const CHERRY_ALT_MARK_RE =
  /#(?:center|right|left|float-right|float-left|border|shadow|radius|B|S|R|auto|\d+(?:px|em|pt|pc|in|mm|cm|ex|%)?)/gi;

/** 单行 Markdown 图片（含 data URL） */
export const MARKDOWN_IMAGE_LINE_RE =
  /^!\[([^\]]*)\]\((data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+)\)\s*$/i;

/** 从正文中提取 Markdown 图片 */
export const MARKDOWN_IMAGE_INLINE_RE =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+)\)/gi;

export type ParsedDataImage = {
  alt: string;
  mime: string;
  extension: 'png' | 'jpg' | 'gif' | 'bmp';
  bytes: Uint8Array;
};

export type MarkdownRenderSegment =
  | { kind: 'markdown'; text: string }
  | { kind: 'image'; alt: string; src: string; rawAlt: string };

/** 从 Cherry alt 解析阅读页显示尺寸（#180px #66px 或 #60%） */
export function parseCherryImageDisplaySize(alt: string): {
  widthPx?: number;
  heightPx?: number;
  widthPct?: number;
} {
  const px = [...alt.matchAll(/#(\d+)px/gi)].map((m) => parseInt(m[1]!, 10));
  if (px.length >= 2) {
    return { widthPx: px[px.length - 2], heightPx: px[px.length - 1] };
  }
  if (px.length === 1) return { widthPx: px[0] };
  const pct = [...alt.matchAll(/#(\d+)%/gi)].map((m) => parseInt(m[1]!, 10));
  if (pct.length) return { widthPct: pct[pct.length - 1] };
  return {};
}

/** Word 单图嵌入上限（解码后字节），避免 docx 生成失败 */
export const MAX_DOCX_IMAGE_BYTES = 6 * 1024 * 1024;

/** 将正文按 base64 图片拆段，避免超长行导致 Markdown 解析/预览失败 */
export function splitMarkdownByDataImages(content: string): MarkdownRenderSegment[] {
  const segments: MarkdownRenderSegment[] = [];
  let lastIndex = 0;
  const re = new RegExp(MARKDOWN_IMAGE_INLINE_RE.source, MARKDOWN_IMAGE_INLINE_RE.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      if (text.trim()) segments.push({ kind: 'markdown', text });
    }
    segments.push({
      kind: 'image',
      alt: stripCherryImageAlt(match[1]!),
      rawAlt: match[1]!,
      src: match[2]!,
    });
    lastIndex = match.index + match[0].length;
  }

  const tail = content.slice(lastIndex);
  if (tail.trim()) segments.push({ kind: 'markdown', text: tail });
  if (segments.length === 0) segments.push({ kind: 'markdown', text: content || ' ' });

  return segments;
}

export function stripCherryImageAlt(alt: string): string {
  return alt.replace(CHERRY_ALT_MARK_RE, '').replace(/\s+/g, ' ').trim();
}

/** Cherry 默认占位 alt（导出时不应作为图注） */
export function isCherryPlaceholderImageAlt(alt: string): boolean {
  const label = stripCherryImageAlt(alt);
  return !label || /^image$/i.test(label);
}

/** 导出用图注：仅保留用户自定义 alt */
export function exportImageCaption(alt: string): string {
  return isCherryPlaceholderImageAlt(alt) ? '' : stripCherryImageAlt(alt);
}

/** 正文中残留的 Cherry alt 碎片（如图片语法后的 image #60%） */
export function stripCherryAltLeakFromText(text: string): string {
  let s = text.replace(CHERRY_ALT_MARK_RE, '');
  s = s.replace(/\s*image\s*$/i, '');
  return s.replace(/\s+/g, ' ').trim();
}

export function parseDataImageUrl(url: string): ParsedDataImage | null {
  const match = url.match(/^data:(image\/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;

  const mime = match[1]!.toLowerCase();
  const extension = mimeToDocxImageType(mime);
  if (!extension) return null;

  try {
    const binary = atob(match[2]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { alt: '', mime, extension, bytes };
  } catch {
    return null;
  }
}

function mimeToDocxImageType(mime: string): ParsedDataImage['extension'] | null {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('bmp')) return 'bmp';
  return null;
}

const DEFAULT_IMAGE_RATIO = 0.75;

function defaultExportImageSize(maxWidth: number): { width: number; height: number } {
  return { width: maxWidth, height: Math.round(maxWidth * DEFAULT_IMAGE_RATIO) };
}

/** 根据 data URL 计算导出到 Word 的尺寸（最大宽度 450px） */
export function measureDataImageSize(
  dataUrl: string,
  maxWidth = 450,
  timeoutMs = 8000
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(defaultExportImageSize(maxWidth));
      return;
    }
    const img = new Image();
    const finish = (width: number, height: number) => {
      window.clearTimeout(timer);
      resolve({ width: Math.max(1, width), height: Math.max(1, height) });
    };
    const timer = window.setTimeout(
      () => finish(maxWidth, Math.round(maxWidth * DEFAULT_IMAGE_RATIO)),
      timeoutMs
    );
    img.onload = () => {
      let width = img.naturalWidth || maxWidth;
      let height = img.naturalHeight || Math.round(maxWidth * 0.75);
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      finish(width, height);
    };
    img.onerror = () => finish(maxWidth, Math.round(maxWidth * DEFAULT_IMAGE_RATIO));
    img.src = dataUrl;
  });
}

/** Word 导出用：短超时，避免用户手势过期导致下载文件名为 blob UUID */
export function measureDataImageSizeForExport(
  dataUrl: string,
  maxWidth = 450
): Promise<{ width: number; height: number }> {
  return measureDataImageSize(dataUrl, maxWidth, 200);
}
