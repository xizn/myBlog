import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button';
import type { AsyncDialogPhase } from '@/hooks/useAsyncDialogPhase';
import './EditorDraftHistoryModal.css';

export interface EditorDraftHistoryItem {
  id: string;
  title: string;
  summary: string;
  meta: string;
}

export type EditorDraftHistorySelection =
  | { kind: 'draft'; draftId: string; title: string }
  | { kind: 'published'; publishedId: string; title: string };

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
  onOpenBatch: (items: EditorDraftHistorySelection[]) => void;
}

function selectionKey(kind: 'draft' | 'published', id: string): string {
  return `${kind}|${id}`;
}

function parseSelectionKey(key: string): { kind: 'draft' | 'published'; id: string } | null {
  const sep = key.indexOf('|');
  if (sep < 0) return null;
  const kind = key.slice(0, sep);
  const id = key.slice(sep + 1);
  if ((kind !== 'draft' && kind !== 'published') || !id) return null;
  return { kind, id };
}

/** 编辑区：右侧抽屉选择历史笔记/草稿 */
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
  onOpenBatch,
}: EditorDraftHistoryModalProps) {
  const ignoreBackdropRef = useRef(false);
  const [multiMode, setMultiMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const resetMulti = useCallback(() => {
    setMultiMode(false);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    if (phase === 'closed') {
      resetMulti();
      return;
    }

    ignoreBackdropRef.current = true;
    const t = window.setTimeout(() => {
      ignoreBackdropRef.current = false;
    }, 200);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (multiMode) {
          resetMulti();
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, onClose, multiMode, resetMulti]);

  const toggleSelected = useCallback((kind: 'draft' | 'published', id: string) => {
    const key = selectionKey(kind, id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleOpenSelected = useCallback(() => {
    if (selected.size === 0) return;
    const items: EditorDraftHistorySelection[] = [];
    for (const key of selected) {
      const parsed = parseSelectionKey(key);
      if (!parsed) continue;
      const list = parsed.kind === 'draft' ? drafts : published;
      const row = list.find((r) => r.id === parsed.id);
      const label = row?.title?.trim() || (parsed.kind === 'draft' ? '未命名草稿' : '未命名');
      if (parsed.kind === 'draft') {
        items.push({ kind: 'draft', draftId: parsed.id, title: label });
      } else {
        items.push({ kind: 'published', publishedId: parsed.id, title: label });
      }
    }
    if (items.length > 0) onOpenBatch(items);
    resetMulti();
  }, [selected, drafts, published, onOpenBatch, resetMulti]);

  const renderItem = (item: EditorDraftHistoryItem, kind: 'draft' | 'published') => {
    const key = selectionKey(kind, item.id);
    const isSelected = selected.has(key);
    const displayTitle = item.title || (kind === 'draft' ? '未命名草稿' : '未命名');

    if (multiMode) {
      return (
        <li key={item.id}>
          <button
            type="button"
            className={`editor-draft-history__item editor-draft-history__item--selectable${
              isSelected ? ' editor-draft-history__item--selected' : ''
            }`}
            aria-pressed={isSelected}
            onClick={() => toggleSelected(kind, item.id)}
          >
            <span className="editor-draft-history__checkbox" aria-hidden="true">
              {isSelected ? '✓' : ''}
            </span>
            <span className="editor-draft-history__item-body">
              <span className="editor-draft-history__item-title">{displayTitle}</span>
              <span className="editor-draft-history__item-summary">
                {item.summary || '暂无简介'}
              </span>
              <span className="editor-draft-history__item-meta">{item.meta}</span>
            </span>
          </button>
        </li>
      );
    }

    return (
      <li key={item.id}>
        <button
          type="button"
          className="editor-draft-history__item"
          onClick={() =>
            kind === 'draft'
              ? onSelectDraft(item.id, displayTitle)
              : onSelectPublished(item.id)
          }
        >
          <span className="editor-draft-history__item-title">{displayTitle}</span>
          <span className="editor-draft-history__item-summary">
            {item.summary || '暂无简介'}
          </span>
          <span className="editor-draft-history__item-meta">{item.meta}</span>
        </button>
      </li>
    );
  };

  if (phase === 'closed') return null;

  const handleBackdrop = () => {
    if (ignoreBackdropRef.current) return;
    if (multiMode) {
      resetMulti();
      return;
    }
    onClose();
  };

  const isLoading = phase === 'loading';
  const selectedCount = selected.size;

  return createPortal(
    <div
      className={`editor-draft-history${multiMode ? ' editor-draft-history--multi' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-draft-history-title"
      aria-busy={isLoading}
    >
      <button
        type="button"
        className="editor-draft-history__backdrop"
        onClick={handleBackdrop}
        aria-label="关闭抽屉"
      />
      <div
        className="editor-draft-history__panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="editor-draft-history__panel-inner">
          <header className="editor-draft-history__header">
            <h2 id="editor-draft-history-title" className="editor-draft-history__title">
              {title}
            </h2>
            <div className="editor-draft-history__header-actions">
              {!isLoading && (
                <button
                  type="button"
                  className={`editor-draft-history__mode-toggle${
                    multiMode ? ' editor-draft-history__mode-toggle--active' : ''
                  }`}
                  aria-pressed={multiMode}
                  onClick={() => (multiMode ? resetMulti() : setMultiMode(true))}
                >
                  {multiMode ? '取消多选' : '多选'}
                </button>
              )}
              <button
                type="button"
                className="editor-draft-history__close"
                onClick={multiMode ? resetMulti : onClose}
                aria-label={multiMode ? '退出多选' : '关闭'}
              >
                ×
              </button>
            </div>
          </header>

          {isLoading ? (
            <div className="editor-draft-history__loading" aria-live="polite">
              <span className="editor-draft-history__spinner" aria-hidden="true" />
              <p className="editor-draft-history__loading-label">正在加载历史记录…</p>
            </div>
          ) : (
            <>
              <div className="editor-draft-history__body thin-scroll">
                {multiMode && (
                  <p className="editor-draft-history__multi-hint">
                    勾选要打开的条目，然后点击底部「打开所选」
                  </p>
                )}
                <section className="editor-draft-history__section">
                  <h3 className="editor-draft-history__section-title">{draftSectionTitle}</h3>
                  {drafts.length === 0 ? (
                    <p className="editor-draft-history__empty">{emptyDraftsMessage}</p>
                  ) : (
                    <ul className="editor-draft-history__list">
                      {drafts.map((item) => renderItem(item, 'draft'))}
                    </ul>
                  )}
                </section>
                <section className="editor-draft-history__section">
                  <h3 className="editor-draft-history__section-title">
                    {publishedSectionTitle}
                  </h3>
                  {published.length === 0 ? (
                    <p className="editor-draft-history__empty">{emptyPublishedMessage}</p>
                  ) : (
                    <ul className="editor-draft-history__list">
                      {published.map((item) => renderItem(item, 'published'))}
                    </ul>
                  )}
                </section>
              </div>
              {multiMode && (
                <footer className="editor-draft-history__footer">
                  <span className="editor-draft-history__footer-count">
                    已选 {selectedCount} 项
                  </span>
                  <Button
                    type="button"
                    variant="glass"
                    disabled={selectedCount === 0}
                    onClick={handleOpenSelected}
                  >
                    打开所选
                  </Button>
                </footer>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
