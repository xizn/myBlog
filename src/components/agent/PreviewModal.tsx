import { useEffect } from 'react';
import { PreviewPanel } from './PreviewPanel';
import './PreviewModal.css';

interface PreviewModalProps {
  open: boolean;
  src: string | null;
  title: string;
  onClose: () => void;
}

/** 全屏预览弹层 */
export function PreviewModal({ open, src, title, onClose }: PreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div className="preview-modal" role="dialog" aria-modal="true" aria-label={`${title} 预览`}>
      <div className="preview-modal__backdrop" onClick={onClose} />
      <div className="preview-modal__content">
        <header className="preview-modal__header">
          <h2 className="preview-modal__title">{title}</h2>
          <button type="button" className="preview-modal__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>
        <PreviewPanel src={src} title={title} />
      </div>
    </div>
  );
}
