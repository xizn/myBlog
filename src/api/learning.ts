import { deleteLearningDraftsByLearningId } from '@/api/learningDrafts';
import { LEARNING_RECORDS } from '@/config/learning.data';
import { STORAGE_KEYS } from '@/constants/storage';
import type { LearningRecord } from '@/types';
import { readList, writeList } from '@/utils/localStore';
import { generateId } from '@/utils/generateId';
import { sortByLastReadAtDesc, sortByUpdatedAtDesc } from '@/utils/sortRecords';
import { nowIso } from '@/utils/today';

/** 模拟网络延迟 */
const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

/** 兼容旧数据 */
function normalizeLearning(record: LearningRecord): LearningRecord {
  return {
    ...record,
    updatedAt: record.updatedAt ?? record.createdAt,
    toBeContinued: record.toBeContinued ?? false,
  };
}

/** 读取本地学习记录列表 */
function loadAll(): LearningRecord[] {
  return readList(STORAGE_KEYS.learnings, LEARNING_RECORDS).map(normalizeLearning);
}

/** 按更新时间倒序（最新在前） */
function sortLearnings(list: LearningRecord[]): LearningRecord[] {
  return sortByUpdatedAtDesc(list);
}

/** 获取全部学习记录 */
export async function fetchLearnings(): Promise<LearningRecord[]> {
  await delay();
  return sortLearnings(loadAll());
}

/** 按 id 获取单条学习记录（不更新阅读时间） */
export async function fetchLearningById(id: string): Promise<LearningRecord | null> {
  await delay(50);
  const item = loadAll().find((r) => r.id === id);
  return item ? normalizeLearning(item) : null;
}

/** 记录阅读时间并返回最新记录（打开详情页时调用） */
export async function recordLearningRead(id: string): Promise<LearningRecord | null> {
  await delay(50);
  const list = loadAll();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updated: LearningRecord = {
    ...list[index]!,
    lastReadAt: nowIso(),
  };
  list[index] = updated;
  writeList(STORAGE_KEYS.learnings, list);
  return updated;
}

/** 获取首页展示的学习记录（未完待续，按上次阅读倒序） */
export async function fetchRecentLearnings(limit = 3): Promise<LearningRecord[]> {
  const all = await fetchLearnings();
  return sortByLastReadAtDesc(all.filter((r) => r.toBeContinued)).slice(0, limit);
}

export type LearningInput = Omit<
  LearningRecord,
  'id' | 'createdAt' | 'updatedAt' | 'lastReadAt'
> & {
  id?: string;
};

/** 新建学习记录 */
export async function createLearning(input: LearningInput): Promise<LearningRecord> {
  await delay();
  const list = loadAll();
  const now = nowIso();
  const record: LearningRecord = {
    ...input,
    id: input.id?.trim() || generateId(input.title),
    createdAt: now,
    updatedAt: now,
  };
  if (list.some((r) => r.id === record.id)) {
    throw new Error('ID 已存在，请更换自定义 ID');
  }
  list.push(record);
  writeList(STORAGE_KEYS.learnings, list);
  return record;
}

/** 更新学习记录 */
export async function updateLearning(
  id: string,
  input: LearningInput
): Promise<LearningRecord | null> {
  await delay();
  const list = loadAll();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const existing = list[index]!;
  const updated: LearningRecord = {
    ...input,
    id,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
    lastReadAt: existing.lastReadAt,
  };
  list[index] = updated;
  writeList(STORAGE_KEYS.learnings, list);
  return updated;
}

/** 删除学习记录 */
export async function deleteLearning(id: string): Promise<boolean> {
  await delay();
  const list = loadAll();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  writeList(STORAGE_KEYS.learnings, next);
  deleteLearningDraftsByLearningId(id);
  return true;
}
