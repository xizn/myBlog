import { Button } from './Button';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 删除确认弹窗 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认删除',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="confirm-dialog" role="alertdialog" aria-modal="true">
      <div className="confirm-dialog__backdrop" onClick={onCancel} />
      <div className="confirm-dialog__box">
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button variant="outline" onClick={onConfirm} disabled={loading}>
            {loading ? '处理中…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
