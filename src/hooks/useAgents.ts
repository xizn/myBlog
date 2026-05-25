import { useEffect, useState } from 'react';
import {
  fetchAgents,
  fetchAgentById,
  fetchFeaturedAgents,
  recordAgentRead,
} from '@/api/agents';
import type { AgentProject } from '@/types';

/** 加载 Agent 列表 */
export function useAgents() {
  const [items, setItems] = useState<AgentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}

interface UseAgentOptions {
  /** 打开详情时写入 lastReadAt */
  recordRead?: boolean;
}

/** 加载单个 Agent */
export function useAgent(id: string | undefined, options?: UseAgentOptions) {
  const recordRead = options?.recordRead ?? false;
  const [item, setItem] = useState<AgentProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setItem(null);
    const loader = recordRead ? recordAgentRead : fetchAgentById;
    loader(id)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [id, recordRead]);

  return { item, loading, setItem };
}

/** 加载精选 Agent */
export function useFeaturedAgents() {
  const [items, setItems] = useState<AgentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedAgents()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}
