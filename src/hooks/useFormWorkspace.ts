import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { removeStorageItem } from '@/utils/appStorage';
import { loadDraft, saveDraft, type SaveDraftResult } from '@/utils/formDraft';

/** 表单工作区：静默自动保存（不写操作记录） */
export function useFormWorkspace<T>(draftKey: string) {
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySaveResult = useCallback((result: SaveDraftResult) => {
    if (result.ok) {
      setDraftSaveError(null);
      setDraftSavedAt(result.savedAt);
      return result.savedAt;
    }
    setDraftSaveError(result.error);
    return null;
  }, []);

  /** 立即写入本地草稿缓存 */
  const persistDraft = useCallback(
    (data: T) => {
      const result = saveDraft(draftKey, data);
      return applySaveResult(result);
    },
    [draftKey, applySaveResult]
  );

  /** 防抖静默保存 */
  const scheduleDraftSave = useCallback(
    (data: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const result = saveDraft(draftKey, data);
        applySaveResult(result);
      }, 800);
    },
    [draftKey, applySaveResult]
  );

  /** 取消待执行的自动保存 */
  const cancelScheduledSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 读取本地草稿缓存 */
  const getDraft = useCallback(() => loadDraft<T>(draftKey), [draftKey]);

  /** 清除本地草稿缓存 */
  const clearLocalDraft = useCallback(() => {
    removeStorageItem(draftKey);
    setDraftSavedAt(null);
  }, [draftKey]);

  useEffect(() => {
    const existing = loadDraft<T>(draftKey);
    if (existing) setDraftSavedAt(existing.savedAt);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draftKey]);

  return useMemo(
    () => ({
      draftSavedAt,
      draftSaveError,
      scheduleDraftSave,
      persistDraft,
      getDraft,
      clearLocalDraft,
      cancelScheduledSave,
      setDraftSavedAt,
      setDraftSaveError,
    }),
    [
      draftSavedAt,
      draftSaveError,
      scheduleDraftSave,
      persistDraft,
      getDraft,
      clearLocalDraft,
      cancelScheduledSave,
      setDraftSavedAt,
      setDraftSaveError,
    ]
  );
}
