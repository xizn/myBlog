import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import '@/components/agent/DraftBox.css';

export interface DraftBoxPanelItem {
  draftId: string;
  title: string;
  summary: string;
  meta: string;
}

interface DraftBoxPanelProps {
  description: string;
  newButtonLabel: string;
  emptyMessage: string;
  items: DraftBoxPanelItem[];
  onNew: () => void;
  onEdit: (draftId: string) => void;
  onDelete: (draftIds: string[]) => number;
}

type DeleteTarget = { mode: 'single'; draftId: string } | { mode: 'batch'; draftIds: string[] } | null;

/** 草稿箱列表（点击「多选删除」进入批量模式） */
export function DraftBoxPanel({
  description,
  newButtonLabel,
  emptyMessage,
  items,
  onNew,
  onEdit,
  onDelete,
}: DraftBoxPanelProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const draftIds = useMemo(() => items.map((d) => d.draftId), [items]);

  useEffect(() => {
    const valid = new Set(draftIds);
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [draftIds]);

  useEffect(() => {
    if (items.length === 0) setSelectionMode(false);
  }, [items.length]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const selectedCount = selected.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  const toggleOne = (draftId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(draftId)) next.delete(draftId);
      else next.add(draftId);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(draftIds));
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const ids =
      deleteTarget.mode === 'single' ? [deleteTarget.draftId] : deleteTarget.draftIds;
    onDelete(ids);
    setDeleteTarget(null);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (deleteTarget.mode === 'batch') exitSelectionMode();
  };

  const deleteMessage = useMemo(() => {
    if (!deleteTarget) return '';
    if (deleteTarget.mode === 'single') {
      const draft = items.find((d) => d.draftId === deleteTarget.draftId);
      return `确定删除草稿「${draft?.title || '未命名'}」？`;
    }
    return `确定删除已选中的 ${deleteTarget.draftIds.length} 条草稿？此操作不可恢复。`;
  }, [deleteTarget, items]);

  return (
    <section className="draft-box">
      <header className="draft-box__header">
        <div>
          <h2 className="draft-box__title">草稿箱</h2>
          <p className="draft-box__desc">{description}</p>
        </div>
        <div className="draft-box__header-actions">
          {items.length > 0 && !selectionMode && (
            <Button
              variant="outline"
              className="draft-box__enter-select"
              onClick={() => setSelectionMode(true)}
            >
              多选删除
            </Button>
          )}
          <Button variant="outline" onClick={onNew}>
            {newButtonLabel}
          </Button>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="draft-box__empty">{emptyMessage}</p>
      ) : (
        <>
          {selectionMode && (
            <div className="draft-box__toolbar">
              <label className="draft-box__select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="全选草稿"
                />
                <span>
                  全选
                  {selectedCount > 0 ? `（已选 ${selectedCount}）` : ''}
                </span>
              </label>
              <div className="draft-box__toolbar-actions">
                <Button
                  variant="ghost"
                  className="draft-box__batch-delete"
                  disabled={selectedCount === 0}
                  onClick={() =>
                    setDeleteTarget({ mode: 'batch', draftIds: [...selected] })
                  }
                >
                  删除选中
                </Button>
                <Button variant="ghost" onClick={exitSelectionMode}>
                  取消
                </Button>
              </div>
            </div>
          )}

          <ul className="draft-box__list">
            {items.map((d) => {
              const checked = selected.has(d.draftId);
              return (
                <li
                  key={d.draftId}
                  className={`draft-box__item ${selectionMode && checked ? 'draft-box__item--selected' : ''} ${selectionMode ? 'draft-box__item--selectable' : ''}`}
                >
                  {selectionMode && (
                    <label className="draft-box__item-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(d.draftId)}
                        aria-label={`选择草稿 ${d.title || '未命名'}`}
                      />
                    </label>
                  )}
                  <div className="draft-box__item-main">
                    <p className="draft-box__item-title">{d.title || '未命名草稿'}</p>
                    <p className="draft-box__item-summary">{d.summary || '暂无摘要'}</p>
                    <p className="draft-box__item-meta">{d.meta}</p>
                  </div>
                  <div className="draft-box__item-actions">
                    <Button
                      variant="primary"
                      className={selectionMode ? 'draft-box__edit-btn--disabled' : undefined}
                      disabled={selectionMode}
                      onClick={() => onEdit(d.draftId)}
                    >
                      继续编辑
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDeleteTarget({ mode: 'single', draftId: d.draftId })}
                    >
                      删除
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.mode === 'batch' ? '批量删除草稿' : '删除草稿'}
        message={deleteMessage}
        loading={false}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
