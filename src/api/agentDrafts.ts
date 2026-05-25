import { toAgentFormValues, type AgentFormValues } from '@/components/form/AgentForm';
import type { AgentDraftRecord } from '@/types/agentDraft';
import type { DraftStatus } from '@/types/learningDraft';
import {
  DRAFT_OP_LEAVE,
  draftSaveActionLabel,
  prependDraftOperation,
} from '@/api/draftOperationLog';
import type { FormOperation } from '@/types/formLog';
import type { SaveDraftResult } from '@/utils/formDraft';
import { getStorageItem, setStorageItem } from '@/utils/appStorage';
import { generateId } from '@/utils/generateId';
import { sortByUpdatedAtDesc } from '@/utils/sortRecords';

const STORAGE_KEY = 'myblog_agent_drafts';

function normalizeRecord(record: AgentDraftRecord): AgentDraftRecord {
  return { ...record, status: record.status ?? 'draft' };
}

/** 读取全部草稿 */
function loadAll(): AgentDraftRecord[] {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as AgentDraftRecord[];
    return Array.isArray(list) ? list.map(normalizeRecord) : [];
  } catch {
    return [];
  }
}

/** 写入全部草稿 */
function saveAll(list: AgentDraftRecord[]): SaveDraftResult {
  const savedAt = new Date().toISOString();
  const result = setStorageItem(STORAGE_KEY, JSON.stringify(list));
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, savedAt };
}

/** 清空用的空白表单（编辑已发布项目时保留 id） */
function emptyDraftData(record: AgentDraftRecord): AgentFormValues {
  const empty = toAgentFormValues();
  if (record.agentId) return { ...empty, id: record.agentId };
  return empty;
}

export type AgentDraftSaveOutcome = {
  record: AgentDraftRecord | null;
  save: SaveDraftResult;
};

/** 获取草稿列表（仅编辑中，按更新时间倒序） */
export function listAgentDrafts(): AgentDraftRecord[] {
  return sortByUpdatedAtDesc(loadAll()).filter((d) => d.status === 'draft');
}

/** 按 draftId 获取草稿 */
export function getAgentDraft(draftId: string): AgentDraftRecord | null {
  return loadAll().find((d) => d.draftId === draftId) ?? null;
}

/** 草稿编辑路由 */
export function getAgentDraftPath(draftId: string): string {
  return `/agents/draft/${draftId}`;
}

/** 按 agentId 查找关联草稿 */
export function getAgentDraftByAgentId(agentId: string): AgentDraftRecord | null {
  return loadAll().find((d) => d.agentId === agentId) ?? null;
}

/** 记录草稿点击操作（非心跳） */
export function logDraftClick(
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

export function logAgentDraftLeaveWithoutSave(draftId: string, title: string): FormOperation[] {
  return logDraftClick(draftId, DRAFT_OP_LEAVE, title.trim() || '未命名');
}

export function logAgentDraftPublished(
  draftId: string,
  title: string,
  isFirstSave: boolean
): FormOperation[] {
  return logDraftClick(draftId, draftSaveActionLabel(isFirstSave), title.trim() || '未命名');
}

/** 创建新草稿 */
export function createAgentDraft(
  agentId?: string,
  initial?: Partial<AgentFormValues>
): AgentDraftRecord {
  const now = new Date().toISOString();
  const draftId = generateId(initial?.title || 'draft');
  const data: AgentFormValues = {
    id: initial?.id ?? agentId ?? '',
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    description: initial?.description ?? '',
    tags: initial?.tags ?? '',
    status: initial?.status ?? 'active',
    repoUrl: initial?.repoUrl ?? '',
    previewUrl: initial?.previewUrl ?? '',
    previewType: initial?.previewType ?? 'none',
    featured: initial?.featured ?? false,
  };
  const record: AgentDraftRecord = {
    draftId,
    agentId,
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
  const result = saveAll(list);
  if (!result.ok) return record;
  logDraftClick(draftId, '创建草稿', agentId ? `关联项目 ${agentId}` : '新建空白草稿');
  return getAgentDraft(draftId) ?? record;
}

/** 静默更新草稿内容（自动保存，不写操作记录） */
export function saveAgentDraftSilent(
  draftId: string,
  data: AgentFormValues
): AgentDraftSaveOutcome {
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

/** 点击保存草稿（写入操作记录） */
export function saveAgentDraftByClick(
  draftId: string,
  data: AgentFormValues
): AgentDraftSaveOutcome {
  const outcome = saveAgentDraftSilent(draftId, data);
  if (outcome.save.ok) {
    logDraftClick(draftId, '点击保存草稿', data.title || '未命名');
    return { record: getAgentDraft(draftId), save: outcome.save };
  }
  return outcome;
}

/** 清空草稿内容与操作记录（保留草稿条目） */
export function clearAgentDraftContent(draftId: string): AgentDraftSaveOutcome {
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

/** 删除草稿 */
export function deleteAgentDraft(draftId: string): boolean {
  return deleteAgentDrafts([draftId]) > 0;
}

/** 批量删除草稿，返回实际删除条数 */
export function deleteAgentDrafts(draftIds: string[]): number {
  if (draftIds.length === 0) return 0;
  const remove = new Set(draftIds);
  const list = loadAll();
  const next = list.filter((d) => !remove.has(d.draftId));
  const deleted = list.length - next.length;
  if (deleted === 0) return 0;
  return saveAll(next).ok ? deleted : 0;
}

/** 删除与已发布项目关联的全部草稿（删除项目时调用） */
export function deleteAgentDraftsByAgentId(agentId: string): void {
  const list = loadAll();
  const next = list.filter((d) => d.agentId !== agentId);
  if (next.length !== list.length) saveAll(next);
}

/** 从已发布项目同步到草稿（编辑用） */
export function ensureAgentEditDraft(
  agentId: string,
  data: AgentFormValues
): AgentDraftRecord {
  const existing = getAgentDraftByAgentId(agentId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const draftId = generateId(data.title || agentId);
  const record: AgentDraftRecord = {
    draftId,
    agentId,
    status: 'saved',
    title: data.title,
    summary: data.summary,
    createdAt: now,
    updatedAt: now,
    data: { ...data, id: agentId },
    operations: [],
  };
  const list = loadAll();
  list.push(record);
  const result = saveAll(list);
  if (!result.ok) return record;
  logDraftClick(draftId, '创建草稿', `基于项目 ${agentId} 编辑`);
  return getAgentDraft(draftId) ?? record;
}

/** 发布成功后删除草稿 */
export function removeAgentDraft(draftId: string): void {
  deleteAgentDraft(draftId);
}

/** 保存项目后标记为已发布，保留编辑会话 */
export function markAgentDraftSaved(
  draftId: string,
  agentId: string,
  data: AgentFormValues
): AgentDraftSaveOutcome {
  const list = loadAll();
  const index = list.findIndex((d) => d.draftId === draftId);
  if (index === -1) return { record: null, save: { ok: false, error: '草稿不存在' } };

  const now = new Date().toISOString();
  const record = list[index]!;
  list[index] = {
    ...record,
    agentId,
    data: { ...data, id: agentId },
    title: data.title,
    summary: data.summary,
    status: 'saved' as DraftStatus,
    updatedAt: now,
  };
  const save = saveAll(list);
  return { record: save.ok ? list[index]! : null, save };
}
