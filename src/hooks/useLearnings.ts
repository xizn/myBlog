import { useEffect, useState } from 'react';
import {
  fetchLearnings,
  fetchLearningById,
  fetchRecentLearnings,
  recordLearningRead,
} from '@/api/learning';
import type { LearningRecord } from '@/types';

/** 加载学习记录列表 */
export function useLearnings() {
  const [items, setItems] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearnings()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}

interface UseLearningOptions {
  /** 打开详情时写入 lastReadAt */
  recordRead?: boolean;
}

/** 加载单条学习记录 */
export function useLearning(id: string | undefined, options?: UseLearningOptions) {
  const recordRead = options?.recordRead ?? false;
  const [item, setItem] = useState<LearningRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setItem(null);
    const loader = recordRead ? recordLearningRead : fetchLearningById;
    loader(id)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [id, recordRead]);

  return { item, loading, setItem };
}

/** 加载最新学习记录 */
export function useRecentLearnings(limit = 3) {
  const [items, setItems] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLearnings(limit)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [limit]);

  return { items, loading };
}
