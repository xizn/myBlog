import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { DialogPortal } from '@/components/common/DialogPortal';
import type { ExportBlock, ExportFormat } from '@/utils/exportRecord';
import { exportRecord } from '@/utils/exportRecord';
import {
  cleanupExportDownload,
  prepareExportDownload,
  type ExportDownloadContext,
} from '@/utils/exportDownload';
import '@/styles/app-dialog.css';
import './ExportMenuButton.css';

interface ExportMenuButtonProps {
  baseName: string;
  blocks: ExportBlock[];
  disabled?: boolean;
  className?: string;
}

const FORMATS: {
  id: ExportFormat;
  label: string;
  ext: string;
  hint: string;
  icon: string;
}[] = [
  { id: 'txt', label: '纯文本', ext: '.txt', hint: '标题、摘要与正文，通用可读', icon: 'TXT' },
  {
    id: 'doc',
    label: 'Word 文档',
    ext: '.docx',
    hint: '保留标题层级并嵌入图片（过大图会提示）',
    icon: 'DOC',
  },
  { id: 'pdf', label: 'PDF 文档', ext: '.pdf', hint: '排版预览效果，适合打印分享', icon: 'PDF' },
];

function safeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'export';
}

/** 详情页导出：IndexDoc 风格格式卡片 + TXT / Word / PDF */
export function ExportMenuButton({ baseName, blocks, disabled, className = '' }: ExportMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState('');

  const runExport = async (format: ExportFormat) => {
    setError('');
    const meta = FORMATS.find((f) => f.id === format);
    const ext = meta?.ext ?? '';
    const filename = `${safeFilename(baseName)}${ext}`;

    let ctx: ExportDownloadContext;
    try {
      ctx = await prepareExportDownload(filename, ext);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '无法选择保存位置');
      return;
    }

    setExporting(format);
    try {
      await exportRecord(format, blocks, baseName, ctx);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      cleanupExportDownload(ctx);
      setExporting(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={disabled || exporting !== null}
        onClick={() => {
          setError('');
          setOpen(true);
        }}
      >
        {exporting ? '导出中…' : '导出'}
      </Button>

      {open && (
        <DialogPortal>
          <div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="export-menu-title">
            <div
              className="app-dialog__backdrop"
              onClick={() => exporting === null && setOpen(false)}
            />
            <div className="app-dialog__panel app-dialog__panel--wide export-menu__panel">
              <h3 id="export-menu-title" className="app-dialog__title">
                导出文档
              </h3>
              <p className="app-dialog__hint export-menu__subtitle">
                「{baseName}」— 选择格式后将弹出保存位置（默认文件名为笔记标题）；生成完成后写入该文件。
              </p>
              <div className="export-menu__grid">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="export-menu__card"
                    disabled={exporting !== null}
                    onClick={() => void runExport(f.id)}
                  >
                    <span className={`export-menu__icon export-menu__icon--${f.id}`}>{f.icon}</span>
                    <span className="export-menu__card-title">
                      {exporting === f.id ? '生成中…' : f.label}
                    </span>
                    <span className="export-menu__card-ext">{f.ext}</span>
                    <span className="export-menu__card-hint">{f.hint}</span>
                  </button>
                ))}
              </div>
              {error && (
                <p className="app-dialog__error" role="alert">
                  {error}
                </p>
              )}
              <div className="app-dialog__actions">
                <Button type="button" variant="ghost" disabled={exporting !== null} onClick={() => setOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </DialogPortal>
      )}
    </>
  );
}
