import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchLearnings } from '@/api/learning';
import {
  ensureLearningEditDraft,
  getLearningDraft,
  listLearningDrafts,
} from '@/api/learningDrafts';
import { EditorDraftHistoryModal } from '@/components/form/EditorDraftHistoryModal';
import { FormEditorTabs } from '@/components/form/FormEditorTabs';
import { toLearningFormValues } from '@/components/form/LearningForm';
import { LearningDraftPanel } from '@/components/learning/LearningDraftPanel';
import { useLearningEditorTabs } from '@/contexts/LearningEditorTabsContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { useAsyncDialogPhase } from '@/hooks/useAsyncDialogPhase';
import type { LearningRecord } from '@/types';
import { formatOpTime } from '@/utils/formDraft';
import '@/components/form/EditorWorkspace.css';

/** 学习笔记多窗口编辑工作区 */
export function LearningEditorWorkspace() {
  const { draftId: routeDraftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { setHeader } = usePageHeader();
  const {
    tabs,
    activeDraftId,
    ensureTab,
    selectTab,
    closeTab,
    openNewDraft,
  } = useLearningEditorTabs();

  const [historyRequested, setHistoryRequested] = useState(false);
  const {
    phase: historyPhase,
    data: publishedNotes,
  } = useAsyncDialogPhase<LearningRecord[]>(historyRequested, fetchLearnings);

  const visibleDraftId = activeDraftId ?? routeDraftId ?? null;

  const draftHistoryItems = useMemo(
    () =>
      listLearningDrafts().map((d) => ({
        id: d.draftId,
        title: d.title,
        summary: d.summary,
        meta:
          d.kind === 'edit' && d.learningId
            ? `编辑笔记 · ${d.learningId} · 更新于 ${formatOpTime(d.savedAt)}`
            : `新建草稿 · 更新于 ${formatOpTime(d.savedAt)}`,
      })),
    [historyPhase, tabs.length]
  );

  const publishedHistoryItems = useMemo(
    () =>
      (publishedNotes ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        meta: `已发布 · 更新于 ${formatOpTime(n.updatedAt)}`,
      })),
    [publishedNotes]
  );

  const closeHistory = useCallback(() => setHistoryRequested(false), []);

  const openDraftInTab = useCallback(
    (draftId: string, title: string) => {
      ensureTab(draftId, title);
      selectTab(draftId);
      closeHistory();
    },
    [ensureTab, selectTab, closeHistory]
  );

  const openPublishedInTab = useCallback(
    (learningId: string) => {
      const note = publishedNotes?.find((n) => n.id === learningId);
      if (!note) return;
      const draft = ensureLearningEditDraft(learningId, toLearningFormValues(note));
      openDraftInTab(draft.draftId, draft.title.trim() || note.title);
    },
    [publishedNotes, openDraftInTab]
  );

  useEffect(() => {
    if (routeDraftId) ensureTab(routeDraftId);
  }, [routeDraftId, ensureTab]);

  useEffect(() => {
    setHeader({ section: '学习记录', action: '编辑' });
    return () => setHeader(null);
  }, [setHeader]);

  if (!visibleDraftId) {
    return (
      <p>
        草稿不存在，<Link to="/learning">返回列表</Link>
      </p>
    );
  }

  const activeRecord = getLearningDraft(visibleDraftId);
  const backTo = activeRecord?.learningId
    ? `/learning/${activeRecord.learningId}`
    : '/learning';

  const tabBar = (
    <FormEditorTabs
      tabs={tabs.map((t) => ({
        id: t.draftId,
        label: t.title,
        isDraft: t.isDraft ?? getLearningDraft(t.draftId)?.status === 'draft',
      }))}
      activeId={visibleDraftId}
      onSelect={selectTab}
      onClose={closeTab}
      onNew={openNewDraft}
      newLabel="+ 新建笔记"
      onOpenHistory={() => setHistoryRequested(true)}
      historyLabel="历史笔记与草稿"
    />
  );

  return (
    <div className="editor-workspace">
      <header className="editor-workspace__header">
        <div className="form-workspace__inner form-workspace__header-row">
          <button
            type="button"
            className="form-workspace__back"
            onClick={() => navigate(backTo)}
          >
            ← 返回
          </button>
          {tabBar}
        </div>
      </header>
      <div className="editor-workspace__panels">
        {tabs.length === 0 ? (
          <p className="page-loading">加载中…</p>
        ) : (
          tabs.map((tab) => (
            <LearningDraftPanel
              key={tab.draftId}
              draftId={tab.draftId}
              active={tab.draftId === visibleDraftId}
            />
          ))
        )}
      </div>
      <EditorDraftHistoryModal
        phase={historyRequested ? historyPhase : 'closed'}
        title="打开历史笔记与草稿"
        draftSectionTitle="草稿"
        publishedSectionTitle="已发布笔记"
        drafts={draftHistoryItems}
        published={publishedHistoryItems}
        emptyDraftsMessage="暂无草稿，可先「+ 新建笔记」或继续编写当前内容"
        emptyPublishedMessage="暂无已发布笔记"
        onClose={closeHistory}
        onSelectDraft={openDraftInTab}
        onSelectPublished={openPublishedInTab}
      />
    </div>
  );
}
