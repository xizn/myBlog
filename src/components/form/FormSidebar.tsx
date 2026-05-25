import { Button } from '@/components/common/Button';
import { DRAFT_OP_FIRST_SAVE, DRAFT_OP_SAVED } from '@/api/draftOperationLog';
import type { FormOperation } from '@/types/formLog';
import { formatOpTime } from '@/utils/formDraft';
import './FormSidebar.css';

interface FormSidebarProps {
  draftTitle: string;
  draftSummary: string;
  draftSavedAt: string | null;
  showDraftPanel?: boolean;
  canRestoreDraft: boolean;
  draftCleared?: boolean;
  draftSaveError?: string | null;
  operations: FormOperation[];
  onRestoreDraft: () => void;
  onClearDraft: () => void;
}

function isSaveSeparator(op: FormOperation): boolean {
  return op.action === DRAFT_OP_FIRST_SAVE || op.action === DRAFT_OP_SAVED;
}

/** 右侧草稿与操作记录面板 */
export function FormSidebar({
  draftTitle,
  draftSummary,
  draftSavedAt,
  showDraftPanel = true,
  canRestoreDraft,
  draftCleared = false,
  draftSaveError = null,
  operations,
  onRestoreDraft,
  onClearDraft,
}: FormSidebarProps) {
  return (
    <aside className="form-sidebar">
      <section className="form-sidebar__block">
        <h3 className="form-sidebar__title">草稿</h3>
        {showDraftPanel ? (
          <>
            <div className="form-sidebar__draft-card">
              <p className="form-sidebar__draft-name">{draftTitle || '未命名'}</p>
              <p className="form-sidebar__draft-desc">
                {draftCleared && canRestoreDraft
                  ? '内容已清空，可恢复上一次草稿'
                  : draftSummary || '暂无简介'}
              </p>
              {draftSavedAt && !draftCleared && (
                <p className="form-sidebar__draft-time">
                  自动保存：{formatOpTime(draftSavedAt)}
                </p>
              )}
            </div>
            {draftSaveError && (
              <p className="form-sidebar__save-error" role="alert">
                草稿未能保存：{draftSaveError}
              </p>
            )}
            <div className="form-sidebar__draft-actions">
              {canRestoreDraft && (
                <Button variant="outline" onClick={onRestoreDraft}>
                  恢复草稿
                </Button>
              )}
              <Button variant="ghost" onClick={onClearDraft}>
                清空
              </Button>
            </div>
          </>
        ) : (
          <p className="form-sidebar__empty">编辑时将自动保存到草稿箱</p>
        )}
      </section>

      <section className="form-sidebar__block form-sidebar__block--grow">
        <h3 className="form-sidebar__title">编辑记录</h3>
        {operations.length === 0 ? (
          <p className="form-sidebar__empty">未保存离开或保存笔记后将显示记录</p>
        ) : (
          <ul className="form-sidebar__timeline thin-scroll">
            {operations.map((op, index) => (
              <li key={op.id}>
                {isSaveSeparator(op) && index > 0 && (
                  <div className="form-sidebar__session-divider" aria-hidden="true">
                    已保存 · 新阶段
                  </div>
                )}
                <div className="form-sidebar__item">
                  <span className="form-sidebar__item-time">{formatOpTime(op.time)}</span>
                  <span className="form-sidebar__item-action">{op.action}</span>
                  {op.detail && <span className="form-sidebar__item-detail">{op.detail}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
