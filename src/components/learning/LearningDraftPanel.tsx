import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLearning, updateLearning } from '@/api/learning';
import {
  clearLearningDraftContent,
  getLearningDraft,
  logLearningDraftLeaveWithoutSave,
  logLearningDraftPublished,
  markLearningDraftSaved,
  saveLearningDraftSilent,
} from '@/api/learningDrafts';
import type { LearningDraftRecord } from '@/types/learningDraft';
import type { FormOperation } from '@/types/formLog';
import {
  LearningForm,
  learningFormToInput,
  toLearningFormValues,
  type LearningFormValues,
} from '@/components/form/LearningForm';
import { FormWorkspace } from '@/components/form/FormWorkspace';
import { useLearningEditorTabs } from '@/contexts/LearningEditorTabsContext';
import { hasLearningDraftContent } from '@/utils/learningDraftContent';
import { useEditorReturnTo } from '@/utils/editorReturnTo';

interface LearningDraftPanelProps {
  draftId: string;
  active: boolean;
}

/** 单个学习笔记草稿面板 */
export function LearningDraftPanel({ draftId, active }: LearningDraftPanelProps) {
  const navigate = useNavigate();
  const { updateTabTitle, updateTabDraftStatus } = useLearningEditorTabs();
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(active);

  const record = getLearningDraft(draftId);

  const [operations, setOperations] = useState<FormOperation[]>(() =>
    record ? [...record.operations] : []
  );
  const [preview, setPreview] = useState(() => ({
    title: record?.title ?? '',
    summary: record?.summary ?? '',
  }));
  const [restoredValues, setRestoredValues] = useState<LearningFormValues | null>(null);
  const [restoreKey, setRestoreKey] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(record?.updatedAt ?? null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [draftCleared, setDraftCleared] = useState(false);
  const [clearedPreview, setClearedPreview] = useState({ title: '', summary: '' });
  const [clearedSnapshot, setClearedSnapshot] = useState<LearningFormValues | null>(null);
  const valuesRef = useRef<LearningFormValues>(record?.data ?? toLearningFormValues());

  const emptyForRecord = useCallback((r: LearningDraftRecord) => {
    const empty = toLearningFormValues();
    if (r.learningId) return { ...empty, id: r.learningId };
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
    const draft = getLearningDraft(draftId);
    return Boolean(draft?.data && hasLearningDraftContent(draft.data));
  }, [clearedSnapshot, draftSavedAt, draftId]);

  const sidebarTitle = draftCleared ? clearedPreview.title : preview.title;
  const sidebarSummary = draftCleared ? clearedPreview.summary : preview.summary;

  const refreshOps = useCallback(() => {
    const latest = getLearningDraft(draftId);
    if (latest) setOperations([...latest.operations]);
  }, [draftId]);

  const recordLeaveWithoutSave = useCallback(() => {
    const latest = getLearningDraft(draftId);
    if (!latest || latest.status !== 'draft') return;
    const title = valuesRef.current.title || preview.title || '未命名';
    setOperations(logLearningDraftLeaveWithoutSave(draftId, title));
  }, [draftId, preview.title]);

  const handleValuesChange = useCallback(
    (values: LearningFormValues) => {
      if (!active) return;
      valuesRef.current = values;
      setPreview({ title: values.title, summary: values.summary });
      if (draftCleared) setDraftCleared(false);
      const { save } = saveLearningDraftSilent(draftId, values);
      applySaveOutcome(save);
      updateTabTitle(draftId, values.title);
      updateTabDraftStatus(draftId, true);
    },
    [draftId, active, applySaveOutcome, draftCleared, updateTabTitle, updateTabDraftStatus]
  );

  useEffect(() => {
    if (!active) return;
    updateTabTitle(draftId, preview.title);
    const latest = getLearningDraft(draftId);
    if (latest) updateTabDraftStatus(draftId, latest.status === 'draft');
  }, [active, draftId, preview.title, updateTabTitle, updateTabDraftStatus, draftSavedAt]);

  useEffect(() => {
    if (wasActiveRef.current && !active) {
      saveLearningDraftSilent(draftId, valuesRef.current);
    }
    wasActiveRef.current = active;
  }, [active, draftId]);

  const handleRestoreDraft = useCallback(() => {
    const snapshot = clearedSnapshot ?? getLearningDraft(draftId)?.data ?? null;
    if (!snapshot || !hasLearningDraftContent(snapshot)) return;

    setRestoredValues({ ...snapshot });
    setRestoreKey((k) => k + 1);
    setPreview({ title: snapshot.title, summary: snapshot.summary });
    valuesRef.current = snapshot;
    const { save } = saveLearningDraftSilent(draftId, snapshot);
    applySaveOutcome(save);
    setClearedSnapshot(null);
    setDraftCleared(false);
    setDraftSaveError(null);
  }, [draftId, clearedSnapshot, applySaveOutcome]);

  const handleClearDraft = useCallback(() => {
    if (!record) return;

    const fromForm = valuesRef.current;
    const fromStorage = getLearningDraft(draftId)?.data;
    const snapshot =
      fromForm && hasLearningDraftContent(fromForm)
        ? { ...fromForm }
        : fromStorage && hasLearningDraftContent(fromStorage)
          ? { ...fromStorage }
          : null;

    if (snapshot) {
      setClearedSnapshot(snapshot);
      setClearedPreview({ title: snapshot.title, summary: snapshot.summary });
    }

    const { save } = clearLearningDraftContent(draftId);
    applySaveOutcome(save);
    refreshOps();

    const empty = emptyForRecord(record);
    setRestoredValues(empty);
    valuesRef.current = empty;
    setRestoreKey((k) => k + 1);
    setPreview({ title: '', summary: '' });
    setOperations([]);
    setDraftCleared(true);
    setDraftSaveError(null);
  }, [draftId, record, applySaveOutcome, emptyForRecord, refreshOps]);

  const handleSubmit = useCallback(
    async (values: LearningFormValues) => {
      const current = getLearningDraft(draftId);
      if (!current) throw new Error('草稿不存在');

      const input = learningFormToInput(values);
      const isFirstSave = !current.learningId;

      let learningId = current.learningId;
      if (learningId) {
        const updated = await updateLearning(learningId, input);
        if (!updated) throw new Error('记录不存在');
      } else {
        const created = await createLearning(input);
        learningId = created.id;
      }

      markLearningDraftSaved(draftId, learningId, { ...values, id: learningId });
      setOperations(logLearningDraftPublished(draftId, values.title, isFirstSave));
      updateTabDraftStatus(draftId, false);
      valuesRef.current = { ...values, id: learningId };
      refreshOps();
    },
    [draftId, refreshOps, updateTabDraftStatus]
  );

  const returnTo = useEditorReturnTo('/learning');

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
        <LearningForm
          initial={record.data}
          restoredValues={restoredValues}
          restoreKey={restoreKey}
          onValuesChange={handleValuesChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </FormWorkspace>
    </div>
  );
}
