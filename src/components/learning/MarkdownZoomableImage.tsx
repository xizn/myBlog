import { useMemo, useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { ImageZoomLightbox } from '@/components/common/ImageZoomLightbox';
import {
  parseCherryImageDisplaySize,
  stripCherryImageAlt,
} from '@/utils/markdownImageData';

function cherryAltToStyle(alt: string): CSSProperties | undefined {
  const { widthPx, heightPx, widthPct } = parseCherryImageDisplaySize(alt);
  if (widthPx && heightPx) {
    return { width: widthPx, height: heightPx, maxWidth: '100%' };
  }
  if (widthPx) {
    return { width: widthPx, maxWidth: '100%', height: 'auto' };
  }
  if (widthPct) {
    return { width: `${widthPct}%`, maxWidth: '100%', height: 'auto' };
  }
  return undefined;
}

/** 博客正文图片：双击放大；识别 Cherry alt 中的 #180px 等尺寸 */
export function MarkdownZoomableImage({
  src,
  alt = '',
  title,
  style,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);
  const displayAlt = useMemo(() => stripCherryImageAlt(alt), [alt]);
  const cherryStyle = useMemo(() => cherryAltToStyle(alt), [alt]);

  if (!src) return null;

  return (
    <>
      <img
        {...rest}
        src={src}
        alt={displayAlt || '正文图片'}
        title={title ?? '双击放大'}
        className={`markdown-content__img ${rest.className ?? ''}`.trim()}
        style={{ ...cherryStyle, ...style }}
        loading="lazy"
        onDoubleClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      />
      {open && (
        <ImageZoomLightbox src={src} alt={displayAlt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
