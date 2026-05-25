import type { FormDraft, FormOperation } from '@/types/formLog';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/appStorage';

/** 读取草稿 */
export function loadDraft<T>(key: string): FormDraft<T> | null {
  try {
    const raw = getStorageItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraft<T>;
  } catch {
    return null;
  }
}

export type SaveDraftResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string };

/** 保存草稿（失败时返回错误信息，便于提示用户） */
export function saveDraft<T>(key: string, data: T): SaveDraftResult {
  const savedAt = new Date().toISOString();
  const draft: FormDraft<T> = { data, savedAt };
  const result = setStorageItem(key, JSON.stringify(draft));
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, savedAt };
}

/** 清除操作记录 */
export function clearOperations(key: string): void {
  removeStorageItem(key);
}

/** 清除草稿 */
export function clearDraft(key: string): void {
  removeStorageItem(key);
}

/** 读取操作记录 */
export function loadOperations(key: string): FormOperation[] {
  try {
    const raw = getStorageItem(key);
    if (!raw) return [];
    const list = JSON.parse(raw) as FormOperation[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 追加操作记录 */
export function appendOperation(key: string, action: string, detail?: string): FormOperation[] {
  const op: FormOperation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: new Date().toISOString(),
    action,
    detail,
  };
  const next = [op, ...loadOperations(key)].slice(0, 60);
  const result = setStorageItem(key, JSON.stringify(next));
  if (!result.ok) {
    console.error(`[Studio Blog] 保存操作记录失败: ${result.error}`);
    return loadOperations(key);
  }
  return next;
}

/** 格式化操作时间 */
export function formatOpTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
