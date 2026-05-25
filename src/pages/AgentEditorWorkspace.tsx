import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchAgents } from '@/api/agents';
import {
  ensureAgentEditDraft,
  getAgentDraft,
  listAgentDrafts,
} from '@/api/agentDrafts';
import { AgentDraftPanel } from '@/components/agent/AgentDraftPanel';
import { toAgentFormValues } from '@/components/form/AgentForm';
import { EditorDraftHistoryModal } from '@/components/form/EditorDraftHistoryModal';
import { FormEditorTabs } from '@/components/form/FormEditorTabs';
import { useAgentEditorTabs } from '@/contexts/AgentEditorTabsContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { useAsyncDialogPhase } from '@/hooks/useAsyncDialogPhase';
import type { AgentProject } from '@/types';
import { formatOpTime } from '@/utils/formDraft';
import { useEditorReturnTo } from '@/utils/editorReturnTo';
import '@/components/form/EditorWorkspace.css';

/** Agent 多窗口编辑工作区（每标签独立面板） */
export function AgentEditorWorkspace() {
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
  } = useAgentEditorTabs();

  const [historyRequested, setHistoryRequested] = useState(false);
  const {
    phase: historyPhase,
    data: publishedProjects,
  } = useAsyncDialogPhase<AgentProject[]>(historyRequested, fetchAgents);

  const visibleDraftId = activeDraftId ?? routeDraftId ?? null;

  const draftHistoryItems = useMemo(
    () =>
      listAgentDrafts().map((d) => ({
        id: d.draftId,
        title: d.title,
        summary: d.summary,
        meta: d.agentId
          ? `编辑项目 · ${d.agentId} · 更新于 ${formatOpTime(d.updatedAt)}`
          : `新建草稿 · 更新于 ${formatOpTime(d.updatedAt)}`,
      })),
    [historyPhase, tabs.length]
  );

  const publishedHistoryItems = useMemo(
    () =>
      (publishedProjects ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        summary: p.summary,
        meta: `已发布 · 更新于 ${formatOpTime(p.updatedAt)}`,
      })),
    [publishedProjects]
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
    (agentId: string) => {
      const project = publishedProjects?.find((p) => p.id === agentId);
      if (!project) return;
      const draft = ensureAgentEditDraft(agentId, toAgentFormValues(project));
      openDraftInTab(draft.draftId, draft.title.trim() || project.title);
    },
    [publishedProjects, openDraftInTab]
  );

  useEffect(() => {
    if (routeDraftId) ensureTab(routeDraftId);
  }, [routeDraftId, ensureTab]);

  useEffect(() => {
    setHeader({ section: 'Agent 项目', action: '编辑' });
    return () => setHeader(null);
  }, [setHeader]);

  const returnTo = useEditorReturnTo('/agents');

  if (!visibleDraftId) {
    return (
      <p>
        草稿不存在，<Link to="/agents">返回项目列表</Link>
      </p>
    );
  }

  const tabBar = (
    <FormEditorTabs
      tabs={tabs.map((t) => ({
        id: t.draftId,
        label: t.title,
        isDraft: t.isDraft ?? getAgentDraft(t.draftId)?.status === 'draft',
      }))}
      activeId={visibleDraftId}
      onSelect={selectTab}
      onClose={closeTab}
      onNew={openNewDraft}
      newLabel="+ 新建项目"
      onOpenHistory={() => setHistoryRequested(true)}
      historyLabel="历史项目与草稿"
    />
  );

  return (
    <div className="editor-workspace">
      <header className="editor-workspace__header">
        <div className="form-workspace__inner form-workspace__header-row">
          <button
            type="button"
            className="form-workspace__back"
            onClick={() => navigate(returnTo)}
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
            <AgentDraftPanel
              key={tab.draftId}
              draftId={tab.draftId}
              active={tab.draftId === visibleDraftId}
            />
          ))
        )}
      </div>
      <EditorDraftHistoryModal
        phase={historyRequested ? historyPhase : 'closed'}
        title="打开历史项目与草稿"
        draftSectionTitle="草稿"
        publishedSectionTitle="已发布项目"
        drafts={draftHistoryItems}
        published={publishedHistoryItems}
        emptyDraftsMessage="暂无草稿，可先「+ 新建项目」或继续编写当前内容"
        emptyPublishedMessage="暂无已发布项目"
        onClose={closeHistory}
        onSelectDraft={openDraftInTab}
        onSelectPublished={openPublishedInTab}
      />
    </div>
  );
}
