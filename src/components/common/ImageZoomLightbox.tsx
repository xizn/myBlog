import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ImageZoomLightbox.css';

const MIN_RELATIVE = 0.25;
const MAX_RELATIVE = 4;
const STEP = 0.25;
const REPEAT_DELAY_MS = 350;
const REPEAT_INTERVAL_MS = 80;

interface ImageZoomLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

function computeFitScale(width: number, height: number): number {
  const maxW = window.innerWidth * 0.92;
  const maxH = window.innerHeight * 0.82;
  if (width <= 0 || height <= 0) return 1;
  return Math.min(maxW / width, maxH / height, 1);
}

function clampScale(scale: number, fitScale: number): number {
  return Math.min(fitScale * MAX_RELATIVE, Math.max(fitScale * MIN_RELATIVE, scale));
}

function useRepeatPress(onAction: () => void) {
  const delayRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    window.clearTimeout(delayRef.current);
    window.clearInterval(intervalRef.current);
  }, []);

  const start = useCallback(() => {
    stop();
    onAction();
    delayRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(onAction, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }, [onAction, stop]);

  useEffect(() => stop, [stop]);

  return {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      start();
    },
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      start();
    },
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
}

/** 图片预览：双击/打开后默认整图适配视口，可缩放与滚轮 */
export function ImageZoomLightbox({ src, alt = '', onClose }: ImageZoomLightboxProps) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [percentDraft, setPercentDraft] = useState<string | null>(null);

  const zoomIn = useCallback(() => {
    setScale((s) => clampScale(+(s + fitScale * STEP).toFixed(4), fitScale));
    setPercentDraft(null);
  }, [fitScale]);

  const zoomOut = useCallback(() => {
    setScale((s) => clampScale(+(s - fitScale * STEP).toFixed(4), fitScale));
    setPercentDraft(null);
  }, [fitScale]);

  const reset = useCallback(() => {
    setScale(fitScale);
    setPercentDraft(null);
  }, [fitScale]);

  const applyPercent = useCallback(
    (raw: string) => {
      const parsed = parseInt(raw, 10);
      if (!Number.isFinite(parsed)) {
        setPercentDraft(null);
        return;
      }
      const clampedPct = Math.min(MAX_RELATIVE * 100, Math.max(MIN_RELATIVE * 100, parsed));
      setScale(clampScale(fitScale * (clampedPct / 100), fitScale));
      setPercentDraft(null);
    },
    [fitScale]
  );

  const zoomInRepeat = useRepeatPress(zoomIn);
  const zoomOutRepeat = useRepeatPress(zoomOut);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const fit = computeFitScale(w, h);
    setNatural({ w, h });
    setFitScale(fit);
    setScale(fit);
    setPercentDraft(null);
  };

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

  const displayPercent = fitScale > 0 ? Math.round((scale / fitScale) * 100) : 100;
  const displayW = natural ? Math.round(natural.w * scale) : undefined;
  const displayH = natural ? Math.round(natural.h * scale) : undefined;

  return createPortal(
    <div className="image-zoom-lightbox" role="dialog" aria-modal="true" aria-label="图片预览">
      <button
        type="button"
        className="image-zoom-lightbox__backdrop"
        onClick={onClose}
        aria-label="关闭预览"
      />
      <div className="image-zoom-lightbox__toolbar">
        <button type="button" aria-label="缩小" {...zoomOutRepeat}>
          −
        </button>
        <label className="image-zoom-lightbox__scale-field">
          <input
            type="text"
            inputMode="numeric"
            className="image-zoom-lightbox__scale-input"
            value={percentDraft ?? String(displayPercent)}
            onChange={(e) => setPercentDraft(e.target.value.replace(/[^\d]/g, ''))}
            onFocus={() => setPercentDraft(String(displayPercent))}
            onBlur={() => applyPercent(percentDraft ?? String(displayPercent))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            aria-label="缩放比例"
          />
          <span className="image-zoom-lightbox__scale-suffix">%</span>
        </label>
        <button type="button" aria-label="放大" {...zoomInRepeat}>
          +
        </button>
        <button type="button" onClick={reset} className="image-zoom-lightbox__reset">
          适应屏幕
        </button>
        <button type="button" onClick={onClose} className="image-zoom-lightbox__close" aria-label="关闭">
          ×
        </button>
      </div>
      <div className="image-zoom-lightbox__stage" onWheel={onWheel}>
        <div className="image-zoom-lightbox__canvas">
          <img
            src={src}
            alt={alt}
            className="image-zoom-lightbox__img"
            style={
              displayW && displayH
                ? { width: displayW, height: displayH }
                : { maxWidth: 'min(92vw, 1200px)', maxHeight: '82vh' }
            }
            draggable={false}
            onLoad={handleLoad}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
