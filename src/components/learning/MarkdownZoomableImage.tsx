import { useState, type ImgHTMLAttributes } from 'react';
import { ImageZoomLightbox } from '@/components/common/ImageZoomLightbox';

/** 博客正文图片：点击放大，支持缩放 */
export function MarkdownZoomableImage({
  src,
  alt = '',
  title,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <img
        {...rest}
        src={src}
        alt={alt}
        title={title ?? '点击放大'}
        className={`markdown-content__img ${rest.className ?? ''}`.trim()}
        loading="lazy"
        onClick={() => setOpen(true)}
      />
      {open && (
        <ImageZoomLightbox src={src} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
