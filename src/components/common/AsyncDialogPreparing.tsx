import { createPortal } from 'react-dom';
import './AsyncDialogPreparing.css';

interface AsyncDialogPreparingProps {
  label?: string;
}

/** 弹窗数据加载中：仅遮罩 + 固定尺寸占位，不渲染会伸缩的内容面板 */
export function AsyncDialogPreparing({ label = '加载中…' }: AsyncDialogPreparingProps) {
  return createPortal(
    <div className="async-dialog-preparing" role="status" aria-live="polite" aria-busy="true">
      <div className="async-dialog-preparing__backdrop" aria-hidden="true" />
      <div className="async-dialog-preparing__card">
        <span className="async-dialog-preparing__spinner" aria-hidden="true" />
        <span className="async-dialog-preparing__label">{label}</span>
      </div>
    </div>,
    document.body
  );
}
