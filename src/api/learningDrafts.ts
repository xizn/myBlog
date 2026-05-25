import { toLearningFormValues, type LearningFormValues } from '@/components/form/LearningForm';
import type { LearningDraftRecord, DraftStatus } from '@/types/learningDraft';
import {
  DRAFT_OP_LEAVE,
  draftSaveActionLabel,
  prependDraftOperation,
} from '@/api/draftOperationLog';
import type { FormOperation } from '@/types/formLog';
import type { SaveDraftResult } from '@/utils/formDraft';
import { clearDraft, loadDraft, loadOperations } from '@/utils/formDraft';
import { getStorageItem, listStorageKeys, removeStorageItem, setStorageItem } from '@/utils/appStorage';
import { generateId } from '@/utils/generateId';
import { hasLearningDraftContent } from '@/utils/learningDraftContent';
import { sortByUpdatedAtDesc } from '@/utils/sortRecords';

const STORAGE_KEY = 'myblog_learning_drafts';
const MIGRATED_KEY = 'myblog_learning_drafts_migrated';
export const LEARNING_DRAFT_PREFIX = 'myblog_draft_learning_';
export const LEARNING_OPS_PREFIX = 'myblog_ops_learning_';

export type LearningDraftKind = 'new' | 'edit';

/** 草稿箱列表项 */
export interface LearningDraftItem {
  draftId: string;
  kind: LearningDraftKind;
  learningId?: string;
  title: string;
  summary: string;
  savedAt: string;
}

export type LearningDraftSaveOutcome = {
  record: LearningDraftRecord | null;
  save: SaveDraftResult;
};

function normalizeRecord(record: LearningDraftRecord): LearningDraftRecord {
  return { ...record, status: record.status ?? 'draft' };
}

function loadAll(): LearningDraftRecord[] {
  migrateLegacyLearningDrafts();
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as LearningDraftRecord[];
    return Array.isArray(list) ? list.map(normalizeRecord) : [];
  } catch {
    return [];
  }
}

function saveAll(list: LearningDraftRecord[]): SaveDraftResult {
  const savedAt = new Date().toISOString();
  const result = setStorageItem(STORAGE_KEY, JSON.stringify(list));
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, savedAt };
}

function emptyDraftData(record: LearningDraftRecord): LearningFormValues {
  const empty = toLearningFormValues();
  if (record.learningId) return { ...empty, id: record.learningId };
  return empty;
}

/** 将旧版单键草稿迁移到草稿列表（仅执行一次） */
function migrateLegacyLearningDrafts(): void {
  if (getStorageItem(MIGRATED_KEY)) return;

  const list = (() => {
    try {
      const raw = getStorageItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LearningDraftRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const hasLearning = (learningId: string) =>
    list.some((d) => d.learningId === learningId);

  for (const key of listStorageKeys()) {
    if (!key.startsWith(LEARNING_DRAFT_PREFIX)) continue;

    const suffix = key.slice(LEARNING_DRAFT_PREFIX.length);
    const legacy = loadDraft<LearningFormValues>(key);
    if (!legacy?.data || !hasLearningDraftContent(legacy.data)) {
      removeStorageItem(key);
      removeStorageItem(`${LEARNING_OPS_PREFIX}${suffix}`);
      continue;
    }

    const learningId = suffix === 'new' ? undefined : suffix;
    if (learningId && hasLearning(learningId)) {
      removeStorageItem(key);
      removeStorageItem(`${LEARNING_OPS_PREFIX}${suffix}`);
      continue;
    }

    const now = legacy.savedAt || new Date().toISOString();
    const draftId = generateId(legacy.data.title || suffix || 'draft');
    const ops = loadOperations(`${LEARNING_OPS_PREFIX}${suffix}`);

    list.push({
      draftId,
      learningId,
      status: 'draft',
      title: legacy.data.title.trim() || '未命名草稿',
      summary: legacy.data.summary.trim(),
      createdAt: now,
      updatedAt: now,
      data: learningId ? { ...legacy.data, id: learningId } : legacy.data,
      operations: ops,
    });

    removeStorageItem(key);
    removeStorageItem(`${LEARNING_OPS_PREFIX}${suffix}`);
  }

  if (list.length > 0) saveAll(list);
  setStorageItem(MIGRATED_KEY, '1');
}

/** 草稿列表（仅编辑中，按更新时间倒序） */
export function listLearningDrafts(): LearningDraftItem[] {
  return sortByUpdatedAtDesc(loadAll())
    .filter((d) => d.status === 'draft')
    .map((d) => ({
    draftId: d.draftId,
    kind: d.learningId ? 'edit' : 'new',
    learningId: d.learningId,
    title: d.title.trim() || '未命名草稿',
    summary: d.summary.trim(),
    savedAt: d.updatedAt,
  }));
}

export function getLearningDraft(draftId: string): LearningDraftRecord | null {
  return loadAll().find((d) => d.draftId === draftId) ?? null;
}

export function getLearningDraftByLearningId(learningId: string): LearningDraftRecord | null {
  return loadAll().find((d) => d.learningId === learningId) ?? null;
}

export function getLearningDraftPath(draftId: string): string {
  return `/learning/draft/${draftId}`;
}

export function logLearningDraftClick(
  draftId: string,
  action: string,
  detail?: string
): FormOperation[] {
  const list = loadAll();
  const index = list.findIndex((d) => d.draftId === draftId);
  if (index === -1) return [];

  const record = list[index]!;
  record.operations = prependDraftOperation(record.operations, action, detail);
  list[index] = record;
  const result = saveAll(list);
  if (!result.ok) return record.operations;
  return record.operations;
}

/** 未保存离开编辑页时记录时间与标题 */
export function logLearningDraftLeaveWithoutSave(draftId: string, title: string): FormOperation[] {
  return logLearningDraftClick(draftId, DRAFT_OP_LEAVE, title.trim() || '未命名');
}

/** 保存笔记后记录（区分首次保存） */
export function logLearningDraftPublished(
  draftId: string,
  title: string,
  isFirstSave: boolean
): FormOperation[] {
  return logLearningDraftClick(draftId, draftSaveActionLabel(isFirstSave), title.trim() || '未命名');
}

/** 创建空白新草稿 */
export function createLearningDraft(
  learningId?: string,
  initial?: Partial<LearningFormValues>
): LearningDraftRecord {
  const now = new Date().toISOString();
  const draftId = generateId(initial?.title || 'draft');
  const data: LearningFormValues = {
    id: initial?.id ?? learningId ?? '',
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    content: initial?.content ?? '',
    tags: initial?.tags ?? '',
    toBeContinued: initial?.toBeContinued ?? false,
  };
  const record: LearningDraftRecord = {
    draftId,
    learningId,
    status: 'draft',
    title: data.title,
    summary: data.summary,
    createdAt: now,
    updatedAt: now,
    data,
    operations: [],
  };
  const list = loadAll();
  list.push(record);
  saveAll(list);
  logLearningDraftClick(
    draftId,
    '创建草稿',
    learningId ? `关联笔记 ${learningId}` : '新建空白草稿'
  );
  return getLearningDraft(draftId) ?? record;
}

export function saveLearningDraftSilent(
  draftId: string,
  data: LearningFormValues
): LearningDraftSaveOutcome {
  const list = loadAll();
  const index = list.findIndex((d) => d.draftId === draftId);
  if (index === -1) return { record: null, save: { ok: false, error: '草稿不存在' } };

  const now = new Date().toISOString();
  const record = list[index]!;
  list[index] = {
    ...record,
    data,
    title: data.title,
    summary: data.summary,
    status: record.status === 'saved' ? 'draft' : record.status,
    updatedAt: now,
  };
  const save = saveAll(list);
  return { record: save.ok ? list[index]! : null, save };
}

export function saveLearningDraftByClick(
  draftId: string,
  data: LearningFormValues
): LearningDraftSaveOutcome {
  const outcome = saveLearningDraftSilent(draftId, data);
  if (outcome.save.ok) {
    logLearningDraftClick(draftId, '点击保存草稿', data.title || '未命名');
    return { record: getLearningDraft(draftId), save: outcome.save };
  }
  return outcome;
}

export function clearLearningDraftContent(draftId: string): LearningDraftSaveOutcome {
  const list = loadAll();
  const index = list.findIndex((d) => d.draftId === draftId);
  if (index === -1) return { record: null, save: { ok: false, error: '草稿不存在' } };

  const record = list[index]!;
  const empty = emptyDraftData(record);
  const now = new Date().toISOString();
  list[index] = {
    ...record,
    data: empty,
    title: '',
    summary: '',
    operations: [],
    updatedAt: now,
  };
  const save = saveAll(list);
  return { record: save.ok ? list[index]! : null, save };
}

export function deleteLearningDraft(draftId: string): boolean {
  return deleteLearningDrafts([draftId]) > 0;
}

/** 批量删除草稿，返回实际删除条数 */
export function deleteLearningDrafts(draftIds: string[]): number {
  if (draftIds.length === 0) return 0;
  const remove = new Set(draftIds);
  const list = loadAll();
  const next = list.filter((d) => !remove.has(d.draftId));
  const deleted = list.length - next.length;
  if (deleted === 0) return 0;
  return saveAll(next).ok ? deleted : 0;
}

export function deleteLearningDraftsByLearningId(learningId: string): void {
  const list = loadAll();
  const next = list.filter((d) => d.learningId !== learningId);
  if (next.length !== list.length) saveAll(next);
  clearDraft(`${LEARNING_DRAFT_PREFIX}${learningId}`);
  removeStorageItem(`${LEARNING_OPS_PREFIX}${learningId}`);
}

export function ensureLearningEditDraft(
  learningId: string,
  data: LearningFormValues
): LearningDraftRecord {
  const existing = getLearningDraftByLearningId(learningId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const draftId = generateId(data.title || learningId);
  const record: LearningDraftRecord = {
    draftId,
    learningId,
    status: 'saved',
    title: data.title,
    summary: data.summary,
    createdAt: now,
    updatedAt: now,
    data: { ...data, id: learningId },
    operations: [],
  };
  const list = loadAll();
  list.push(record);
  saveAll(list);
  logLearningDraftClick(draftId, '创建草稿', `基于笔记 ${learningId} 编辑`);
  return getLearningDraft(draftId) ?? record;
}

export function removeLearningDraft(draftId: string): void {
  deleteLearningDraft(draftId);
}

/** 保存笔记后标记为已发布，保留编辑会话 */
export function markLearningDraftSaved(
  draftId: string,
  learningId: string,
  data: LearningFormValues
): LearningDraftSaveOutcome {
  const list = loadAll();
  const index = list.findIndex((d) => d.draftId === draftId);
  if (index === -1) return { record: null, save: { ok: false, error: '草稿不存在' } };

  const now = new Date().toISOString();
  const record = list[index]!;
  list[index] = {
    ...record,
    learningId,
    data: { ...data, id: learningId },
    title: data.title,
    summary: data.summary,
    status: 'saved' as DraftStatus,
    updatedAt: now,
  };
  const save = saveAll(list);
  return { record: save.ok ? list[index]! : null, save };
}
