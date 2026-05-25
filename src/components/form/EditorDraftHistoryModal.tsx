import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { AsyncDialogPhase } from '@/hooks/useAsyncDialogPhase';
import { AsyncDialogPreparing } from '@/components/common/AsyncDialogPreparing';
import './EditorDraftHistoryModal.css';

export interface EditorDraftHistoryItem {
  id: string;
  title: string;
  summary: string;
  meta: string;
}

interface EditorDraftHistoryModalProps {
  phase: AsyncDialogPhase;
  title: string;
  draftSectionTitle: string;
  publishedSectionTitle: string;
  drafts: EditorDraftHistoryItem[];
  published: EditorDraftHistoryItem[];
  emptyDraftsMessage: string;
  emptyPublishedMessage: string;
  onClose: () => void;
  onSelectDraft: (draftId: string, title: string) => void;
  onSelectPublished: (publishedId: string) => void;
}

/** 编辑区：选择历史笔记/草稿并加入顶栏标签（数据就绪后再展示面板） */
export function EditorDraftHistoryModal({
  phase,
  title,
  draftSectionTitle,
  publishedSectionTitle,
  drafts,
  published,
  emptyDraftsMessage,
  emptyPublishedMessage,
  onClose,
  onSelectDraft,
  onSelectPublished,
}: EditorDraftHistoryModalProps) {
  const ignoreBackdropRef = useRef(false);

  useEffect(() => {
    if (phase !== 'ready') return;
    ignoreBackdropRef.current = true;
    const t = window.setTimeout(() => {
      ignoreBackdropRef.current = false;
    }, 200);

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, onClose]);

  if (phase === 'closed') return null;
  if (phase === 'loading') {
    return <AsyncDialogPreparing label="正在加载历史记录…" />;
  }

  const handleBackdrop = () => {
    if (ignoreBackdropRef.current) return;
    onClose();
  };

  return createPortal(
    <div
      className="editor-draft-history"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-draft-history-title"
    >
      <div className="editor-draft-history__backdrop" onMouseDown={handleBackdrop} />
      <div className="editor-draft-history__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="editor-draft-history__panel-inner">
          <header className="editor-draft-history__header">
          <h2 id="editor-draft-history-title" className="editor-draft-history__title">
            {title}
          </h2>
          <button
            type="button"
            className="editor-draft-history__close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </header>
        <div className="editor-draft-history__body thin-scroll">
          <section className="editor-draft-history__section">
            <h3 className="editor-draft-history__section-title">{draftSectionTitle}</h3>
            {drafts.length === 0 ? (
              <p className="editor-draft-history__empty">{emptyDraftsMessage}</p>
            ) : (
              <ul className="editor-draft-history__list">
                {drafts.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="editor-draft-history__item"
                      onClick={() => onSelectDraft(item.id, item.title)}
                    >
                      <span className="editor-draft-history__item-title">
                        {item.title || '未命名草稿'}
                      </span>
                      <span className="editor-draft-history__item-summary">
                        {item.summary || '暂无简介'}
                      </span>
                      <span className="editor-draft-history__item-meta">{item.meta}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="editor-draft-history__section">
            <h3 className="editor-draft-history__section-title">{publishedSectionTitle}</h3>
            {published.length === 0 ? (
              <p className="editor-draft-history__empty">{emptyPublishedMessage}</p>
            ) : (
              <ul className="editor-draft-history__list">
                {published.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="editor-draft-history__item"
                      onClick={() => onSelectPublished(item.id)}
                    >
                      <span className="editor-draft-history__item-title">
                        {item.title || '未命名'}
                      </span>
                      <span className="editor-draft-history__item-summary">
                        {item.summary || '暂无简介'}
                      </span>
                      <span className="editor-draft-history__item-meta">{item.meta}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
