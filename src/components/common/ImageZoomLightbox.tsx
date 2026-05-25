import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ImageZoomLightbox.css';

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const STEP = 0.25;

interface ImageZoomLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

/** 图片预览：点击放大，支持缩放与滚轮 */
export function ImageZoomLightbox({ src, alt = '', onClose }: ImageZoomLightboxProps) {
  const [scale, setScale] = useState(1);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, +(s + STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, +(s - STEP).toFixed(2)));
  }, []);

  const reset = useCallback(() => setScale(1), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  return createPortal(
    <div className="image-zoom-lightbox" role="dialog" aria-modal="true" aria-label="图片预览">
      <button
        type="button"
        className="image-zoom-lightbox__backdrop"
        onClick={onClose}
        aria-label="关闭预览"
      />
      <div className="image-zoom-lightbox__toolbar">
        <button type="button" onClick={zoomOut} aria-label="缩小">
          −
        </button>
        <span className="image-zoom-lightbox__scale">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={zoomIn} aria-label="放大">
          +
        </button>
        <button type="button" onClick={reset} className="image-zoom-lightbox__reset">
          重置
        </button>
        <button type="button" onClick={onClose} className="image-zoom-lightbox__close" aria-label="关闭">
          ×
        </button>
      </div>
      <div className="image-zoom-lightbox__stage" onWheel={onWheel}>
        <img
          src={src}
          alt={alt}
          className="image-zoom-lightbox__img"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
}
