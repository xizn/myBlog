import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import {
  createAgentDraft,
  getAgentDraft,
  getAgentDraftPath,
} from '@/api/agentDrafts';
import {
  defaultAgentTabTitle,
  loadAgentEditorTabs,
  NEW_AGENT_REDIRECT_KEY,
  persistAgentEditorTabs,
  REDIRECT_TTL_MS,
  type EditorTabItem,
} from '@/contexts/agentEditorTabsShared';

export type AgentEditorTab = EditorTabItem;

interface AgentEditorTabsContextValue {
  tabs: AgentEditorTab[];
  /** 当前显示的标签（立即更新，不等待路由） */
  activeDraftId: string | null;
  setActiveDraftId: (draftId: string | null) => void;
  ensureTab: (draftId: string, title?: string) => void;
  updateTabTitle: (draftId: string, title: string) => void;
  updateTabDraftStatus: (draftId: string, isDraft: boolean) => void;
  closeTab: (draftId: string) => void;
  removeTab: (draftId: string) => void;
  openNewDraft: () => void;
  openNewDraftWithGuard: () => void;
  selectTab: (draftId: string) => void;
}

const AgentEditorTabsContext = createContext<AgentEditorTabsContextValue | null>(null);

export function AgentEditorTabsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const match = useMatch('/agents/draft/:draftId');
  const routeDraftId = match?.params.draftId ?? null;

  const [tabs, setTabs] = useState<AgentEditorTab[]>(loadAgentEditorTabs);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(
    () => routeDraftId ?? loadAgentEditorTabs()[0]?.draftId ?? null
  );

  useEffect(() => {
    persistAgentEditorTabs(tabs);
  }, [tabs]);

  /** 浏览器前进/后退、外部链入时与 URL 对齐 */
  useEffect(() => {
    if (!routeDraftId) return;
    setActiveDraftId(routeDraftId);
    setTabs((prev) => {
      if (prev.some((t) => t.draftId === routeDraftId)) return prev;
      return [
        ...prev,
        { draftId: routeDraftId, title: defaultAgentTabTitle(routeDraftId), isDraft: getAgentDraft(routeDraftId)?.status === 'draft' },
      ];
    });
  }, [routeDraftId]);

  const ensureTab = useCallback((draftId: string, title?: string) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.draftId === draftId);
      if (exists) {
        if (!title?.trim() || title === exists.title) return prev;
        return prev.map((t) =>
          t.draftId === draftId ? { ...t, title: title.trim() || t.title } : t
        );
      }
      return [...prev, { draftId, title: title?.trim() || defaultAgentTabTitle(draftId), isDraft: getAgentDraft(draftId)?.status === 'draft' }];
    });
  }, []);

  const updateTabTitle = useCallback((draftId: string, title: string) => {
    const label = title.trim() || '未命名草稿';
    setTabs((prev) =>
      prev.map((t) => (t.draftId === draftId ? { ...t, title: label } : t))
    );
  }, []);

  const updateTabDraftStatus = useCallback((draftId: string, isDraft: boolean) => {
    setTabs((prev) =>
      prev.map((t) => (t.draftId === draftId ? { ...t, isDraft } : t))
    );
  }, []);

  const selectTab = useCallback(
    (draftId: string) => {
      setActiveDraftId(draftId);
      ensureTab(draftId);
      const path = getAgentDraftPath(draftId);
      if (routeDraftId !== draftId) {
        navigate(path);
      }
    },
    [ensureTab, navigate, routeDraftId]
  );

  const closeTab = useCallback(
    (draftId: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.draftId !== draftId);
        setActiveDraftId((current) => {
          if (draftId !== current) return current;
          const fallback = next[0]?.draftId ?? null;
          if (fallback) {
            navigate(getAgentDraftPath(fallback), { replace: true });
          } else {
            navigate('/agents', { replace: true });
          }
          return fallback;
        });
        return next;
      });
    },
    [navigate]
  );

  const removeTab = useCallback((draftId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.draftId !== draftId);
      if (draftId === activeDraftId) {
        setActiveDraftId(next[0]?.draftId ?? null);
      }
      return next;
    });
  }, [activeDraftId]);

  const openNewDraft = useCallback(() => {
    const draft = createAgentDraft();
    const tab: AgentEditorTab = {
      draftId: draft.draftId,
      title: draft.title.trim() || '未命名草稿',
      isDraft: true,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveDraftId(draft.draftId);
    try {
      sessionStorage.setItem(
        NEW_AGENT_REDIRECT_KEY,
        JSON.stringify({ draftId: draft.draftId, ts: Date.now() })
      );
    } catch {
      /* ignore */
    }
    navigate(getAgentDraftPath(draft.draftId));
  }, [navigate]);

  const openNewDraftWithGuard = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(NEW_AGENT_REDIRECT_KEY);
      if (raw) {
        const { draftId, ts } = JSON.parse(raw) as { draftId: string; ts: number };
        if (Date.now() - ts < REDIRECT_TTL_MS) {
          const existing = getAgentDraft(draftId);
          if (existing && !existing.agentId) {
            setActiveDraftId(draftId);
            ensureTab(draftId, existing.title);
            navigate(getAgentDraftPath(draftId), { replace: true });
            return;
          }
        }
      }
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem(NEW_AGENT_REDIRECT_KEY);
    openNewDraft();
  }, [ensureTab, navigate, openNewDraft]);

  const value = useMemo(
    () => ({
      tabs,
      activeDraftId,
      setActiveDraftId,
      ensureTab,
      updateTabTitle,
      updateTabDraftStatus,
      closeTab,
      removeTab,
      openNewDraft,
      openNewDraftWithGuard,
      selectTab,
    }),
    [
      tabs,
      activeDraftId,
      ensureTab,
      updateTabTitle,
      updateTabDraftStatus,
      closeTab,
      removeTab,
      openNewDraft,
      openNewDraftWithGuard,
      selectTab,
    ]
  );

  return (
    <AgentEditorTabsContext.Provider value={value}>{children}</AgentEditorTabsContext.Provider>
  );
}

export function useAgentEditorTabs(): AgentEditorTabsContextValue {
  const ctx = useContext(AgentEditorTabsContext);
  if (!ctx) {
    throw new Error('useAgentEditorTabs 须在 AgentEditorTabsProvider 内使用');
  }
  return ctx;
}

export { NEW_AGENT_REDIRECT_KEY } from '@/contexts/agentEditorTabsShared';
