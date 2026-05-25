import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { FormSidebar } from './FormSidebar';
import type { FormOperation } from '@/types/formLog';
import './FormWorkspace.css';

interface FormWorkspaceProps {
  /** 无多窗口标签时显示的标题 */
  title?: string;
  /** 顶栏多窗口标签（有则替代 title） */
  editorTabs?: React.ReactNode;
  /** 顶栏副标题栏目，如「Agent 项目」 */
  headerSection?: string;
  /** 顶栏副标题操作，如「新建」「编辑」 */
  headerAction?: string;
  backTo: string;
  draftTitle: string;
  draftSummary: string;
  draftSavedAt: string | null;
  showDraftPanel?: boolean;
  canRestoreDraft: boolean;
  draftCleared?: boolean;
  draftSaveError?: string | null;
  operations: FormOperation[];
  /** 返回列表前回调（记录未保存离开等） */
  onBeforeBack?: () => void;
  onRestoreDraft: () => void;
  onClearDraft: () => void;
  /** 多窗口工作区已自带顶栏时隐藏 */
  hideHeader?: boolean;
  /** 绑定可滚动主区域（供滚动按钮使用） */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

/** 全屏双栏表单工作区 */
export function FormWorkspace({
  title,
  editorTabs,
  headerSection,
  headerAction,
  backTo,
  draftTitle,
  draftSummary,
  draftSavedAt,
  showDraftPanel = true,
  canRestoreDraft,
  draftCleared,
  draftSaveError,
  operations,
  onBeforeBack,
  onRestoreDraft,
  onClearDraft,
  hideHeader = false,
  scrollContainerRef,
  children,
}: FormWorkspaceProps) {
  const navigate = useNavigate();
  const { setHeader } = usePageHeader();

  useEffect(() => {
    if (headerSection && headerAction) {
      setHeader({ section: headerSection, action: headerAction });
    }
    return () => setHeader(null);
  }, [headerSection, headerAction, setHeader]);

  const handleBack = useCallback(() => {
    onBeforeBack?.();
    navigate(backTo);
  }, [navigate, backTo, onBeforeBack]);

  return (
    <div className="form-workspace">
      {!hideHeader && (
        <header className="form-workspace__header">
          <div className="form-workspace__inner form-workspace__header-row">
            <button type="button" className="form-workspace__back" onClick={handleBack}>
              ← 返回
            </button>
            {editorTabs ?? (title ? <h1 className="form-workspace__title">{title}</h1> : null)}
          </div>
        </header>
      )}
      <div className="form-workspace__body thin-scroll">
        <div ref={scrollContainerRef as React.RefObject<HTMLDivElement>} className="form-workspace__main thin-scroll">
          <div className="form-workspace__inner">{children}</div>
        </div>
        <FormSidebar
          draftTitle={draftTitle}
          draftSummary={draftSummary}
          draftSavedAt={draftSavedAt}
          showDraftPanel={showDraftPanel}
          canRestoreDraft={canRestoreDraft}
          draftCleared={draftCleared}
          draftSaveError={draftSaveError}
          operations={operations}
          onRestoreDraft={onRestoreDraft}
          onClearDraft={onClearDraft}
        />
      </div>
    </div>
  );
}
