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
  createLearningDraft,
  getLearningDraft,
  getLearningDraftPath,
} from '@/api/learningDrafts';
import {
  defaultLearningTabTitle,
  loadLearningEditorTabs,
  NEW_LEARNING_REDIRECT_KEY,
  persistLearningEditorTabs,
  REDIRECT_TTL_MS,
  type EditorTabItem,
} from '@/contexts/learningEditorTabsShared';

export type LearningEditorTab = EditorTabItem;

interface LearningEditorTabsContextValue {
  tabs: LearningEditorTab[];
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

const LearningEditorTabsContext = createContext<LearningEditorTabsContextValue | null>(null);

export function LearningEditorTabsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const match = useMatch('/learning/draft/:draftId');
  const routeDraftId = match?.params.draftId ?? null;

  const [tabs, setTabs] = useState<LearningEditorTab[]>(loadLearningEditorTabs);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(
    () => routeDraftId ?? loadLearningEditorTabs()[0]?.draftId ?? null
  );

  useEffect(() => {
    persistLearningEditorTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    if (!routeDraftId) return;
    setActiveDraftId(routeDraftId);
    setTabs((prev) => {
      if (prev.some((t) => t.draftId === routeDraftId)) return prev;
      return [
        ...prev,
        { draftId: routeDraftId, title: defaultLearningTabTitle(routeDraftId), isDraft: getLearningDraft(routeDraftId)?.status === 'draft' },
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
      return [...prev, { draftId, title: title?.trim() || defaultLearningTabTitle(draftId), isDraft: getLearningDraft(draftId)?.status === 'draft' }];
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
      const path = getLearningDraftPath(draftId);
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
            navigate(getLearningDraftPath(fallback), { replace: true });
          } else {
            navigate('/learning', { replace: true });
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
    const draft = createLearningDraft();
    const tab: LearningEditorTab = {
      draftId: draft.draftId,
      title: draft.title.trim() || '未命名草稿',
      isDraft: true,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveDraftId(draft.draftId);
    try {
      sessionStorage.setItem(
        NEW_LEARNING_REDIRECT_KEY,
        JSON.stringify({ draftId: draft.draftId, ts: Date.now() })
      );
    } catch {
      /* ignore */
    }
    navigate(getLearningDraftPath(draft.draftId));
  }, [navigate]);

  const openNewDraftWithGuard = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(NEW_LEARNING_REDIRECT_KEY);
      if (raw) {
        const { draftId, ts } = JSON.parse(raw) as { draftId: string; ts: number };
        if (Date.now() - ts < REDIRECT_TTL_MS) {
          const existing = getLearningDraft(draftId);
          if (existing && !existing.learningId) {
            setActiveDraftId(draftId);
            ensureTab(draftId, existing.title);
            navigate(getLearningDraftPath(draftId), { replace: true });
            return;
          }
        }
      }
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem(NEW_LEARNING_REDIRECT_KEY);
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
    <LearningEditorTabsContext.Provider value={value}>
      {children}
    </LearningEditorTabsContext.Provider>
  );
}

export function useLearningEditorTabs(): LearningEditorTabsContextValue {
  const ctx = useContext(LearningEditorTabsContext);
  if (!ctx) {
    throw new Error('useLearningEditorTabs 须在 LearningEditorTabsProvider 内使用');
  }
  return ctx;
}

export { NEW_LEARNING_REDIRECT_KEY } from '@/contexts/learningEditorTabsShared';
