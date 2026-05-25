import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAgent, updateAgent } from '@/api/agents';
import {
  clearAgentDraftContent,
  getAgentDraft,
  logAgentDraftLeaveWithoutSave,
  logAgentDraftPublished,
  markAgentDraftSaved,
  saveAgentDraftSilent,
} from '@/api/agentDrafts';
import type { AgentDraftRecord } from '@/types/agentDraft';
import type { FormOperation } from '@/types/formLog';
import { hasAgentDraftContent } from '@/utils/agentDraftContent';
import { useEditorReturnTo } from '@/utils/editorReturnTo';
import {
  AgentForm,
  agentFormToInput,
  toAgentFormValues,
  type AgentFormValues,
} from '@/components/form/AgentForm';
import { FormWorkspace } from '@/components/form/FormWorkspace';
import { ScrollNavButtons } from '@/components/form/ScrollNavButtons';
import { useAgentEditorTabs } from '@/contexts/AgentEditorTabsContext';

interface AgentDraftPanelProps {
  draftId: string;
  active: boolean;
}

/** 单个 Agent 草稿编辑面板（固定 draftId，切换标签时仅隐藏不卸载） */
export function AgentDraftPanel({ draftId, active }: AgentDraftPanelProps) {
  const navigate = useNavigate();
  const { updateTabTitle, updateTabDraftStatus } = useAgentEditorTabs();
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(active);

  const record = getAgentDraft(draftId);

  const [operations, setOperations] = useState<FormOperation[]>(() =>
    record ? [...record.operations] : []
  );
  const [preview, setPreview] = useState(() => ({
    title: record?.title ?? '',
    summary: record?.summary ?? '',
  }));
  const [restoredValues, setRestoredValues] = useState<AgentFormValues | null>(null);
  const [restoreKey, setRestoreKey] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(record?.updatedAt ?? null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [draftCleared, setDraftCleared] = useState(false);
  const [clearedPreview, setClearedPreview] = useState({ title: '', summary: '' });
  const [clearedSnapshot, setClearedSnapshot] = useState<AgentFormValues | null>(null);
  const valuesRef = useRef<AgentFormValues>(record?.data ?? toAgentFormValues());

  const emptyForRecord = useCallback((r: AgentDraftRecord) => {
    const empty = toAgentFormValues();
    if (r.agentId) return { ...empty, id: r.agentId };
    return empty;
  }, []);

  const applySaveOutcome = useCallback(
    (save: { ok: true; savedAt: string } | { ok: false; error: string }) => {
      if (save.ok) {
        setDraftSaveError(null);
        setDraftSavedAt(save.savedAt);
      } else {
        setDraftSaveError(save.error);
      }
    },
    []
  );

  const canRestoreDraft = useMemo(() => {
    if (clearedSnapshot) return true;
    const draft = getAgentDraft(draftId);
    return Boolean(draft?.data && hasAgentDraftContent(draft.data));
  }, [clearedSnapshot, draftSavedAt, draftId]);

  const sidebarTitle = draftCleared ? clearedPreview.title : preview.title;
  const sidebarSummary = draftCleared ? clearedPreview.summary : preview.summary;

  const refreshOps = useCallback(() => {
    const latest = getAgentDraft(draftId);
    if (latest) setOperations([...latest.operations]);
  }, [draftId]);

  const recordLeaveWithoutSave = useCallback(() => {
    const latest = getAgentDraft(draftId);
    if (!latest || latest.status !== 'draft') return;
    const title = valuesRef.current.title || preview.title || '未命名';
    setOperations(logAgentDraftLeaveWithoutSave(draftId, title));
  }, [draftId, preview.title]);

  const handleValuesChange = useCallback(
    (values: AgentFormValues) => {
      if (!active) return;
      valuesRef.current = values;
      setPreview({ title: values.title, summary: values.summary });
      if (draftCleared) setDraftCleared(false);
      const { save } = saveAgentDraftSilent(draftId, values);
      applySaveOutcome(save);
      updateTabTitle(draftId, values.title);
      updateTabDraftStatus(draftId, true);
    },
    [draftId, active, applySaveOutcome, draftCleared, updateTabTitle, updateTabDraftStatus]
  );

  useEffect(() => {
    if (!active) return;
    updateTabTitle(draftId, preview.title);
    const latest = getAgentDraft(draftId);
    if (latest) updateTabDraftStatus(draftId, latest.status === 'draft');
  }, [active, draftId, preview.title, updateTabTitle, updateTabDraftStatus, draftSavedAt]);

  useEffect(() => {
    if (wasActiveRef.current && !active) {
      saveAgentDraftSilent(draftId, valuesRef.current);
    }
    wasActiveRef.current = active;
  }, [active, draftId]);

  const handleRestoreDraft = useCallback(() => {
    const snapshot = clearedSnapshot ?? getAgentDraft(draftId)?.data ?? null;
    if (!snapshot || !hasAgentDraftContent(snapshot)) return;

    setRestoredValues({ ...snapshot });
    valuesRef.current = snapshot;
    setRestoreKey((k) => k + 1);
    setPreview({ title: snapshot.title, summary: snapshot.summary });
    const { save } = saveAgentDraftSilent(draftId, snapshot);
    applySaveOutcome(save);
    setClearedSnapshot(null);
    setDraftCleared(false);
    refreshOps();
  }, [draftId, clearedSnapshot, applySaveOutcome, refreshOps]);

  const handleClearDraft = useCallback(() => {
    if (!record) return;

    const fromForm = valuesRef.current;
    const fromStorage = getAgentDraft(draftId)?.data;
    const snapshot =
      fromForm && hasAgentDraftContent(fromForm)
        ? { ...fromForm }
        : fromStorage && hasAgentDraftContent(fromStorage)
          ? { ...fromStorage }
          : null;

    if (snapshot) {
      setClearedSnapshot(snapshot);
      setClearedPreview({ title: snapshot.title, summary: snapshot.summary });
    }

    const { save } = clearAgentDraftContent(draftId);
    applySaveOutcome(save);
    const empty = emptyForRecord(record);
    setRestoredValues(empty);
    valuesRef.current = empty;
    setRestoreKey((k) => k + 1);
    setPreview({ title: '', summary: '' });
    setOperations([]);
    setDraftCleared(true);
    setDraftSaveError(null);
  }, [draftId, record, applySaveOutcome, emptyForRecord]);

  const handleSubmit = useCallback(
    async (values: AgentFormValues) => {
      const current = getAgentDraft(draftId);
      if (!current) throw new Error('草稿不存在');

      const input = agentFormToInput(values);
      const isFirstSave = !current.agentId;

      let agentId = current.agentId;
      if (agentId) {
        const updated = await updateAgent(agentId, input);
        if (!updated) throw new Error('项目不存在');
      } else {
        const created = await createAgent(input);
        agentId = created.id;
      }

      markAgentDraftSaved(draftId, agentId, { ...values, id: agentId });
      setOperations(logAgentDraftPublished(draftId, values.title, isFirstSave));
      updateTabDraftStatus(draftId, false);
      valuesRef.current = { ...values, id: agentId };
      refreshOps();
    },
    [draftId, refreshOps, updateTabDraftStatus]
  );

  const returnTo = useEditorReturnTo('/agents');

  const handleCancel = useCallback(() => {
    recordLeaveWithoutSave();
    navigate(returnTo);
  }, [navigate, recordLeaveWithoutSave, returnTo]);

  if (!record) return null;

  return (
    <div
      className={`editor-draft-panel ${active ? 'editor-draft-panel--active' : ''}`}
      aria-hidden={!active}
    >
      <FormWorkspace
        hideHeader
        backTo={returnTo}
        draftTitle={sidebarTitle}
        draftSummary={sidebarSummary}
        draftSavedAt={draftSavedAt ?? record.updatedAt}
        showDraftPanel
        canRestoreDraft={canRestoreDraft}
        draftCleared={draftCleared}
        draftSaveError={draftSaveError}
        operations={operations}
        onBeforeBack={recordLeaveWithoutSave}
        onRestoreDraft={handleRestoreDraft}
        onClearDraft={handleClearDraft}
        scrollContainerRef={scrollRef}
      >
        <AgentForm
          initial={record.data}
          restoredValues={restoredValues}
          restoreKey={restoreKey}
          onValuesChange={handleValuesChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </FormWorkspace>
      {active && <ScrollNavButtons containerRef={scrollRef} />}
    </div>
  );
}
