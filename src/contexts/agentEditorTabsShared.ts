import { getAgentDraft } from '@/api/agentDrafts';

export const AGENT_EDITOR_TABS_KEY = 'myblog_agent_editor_tabs';
export const NEW_AGENT_REDIRECT_KEY = 'myblog_agent_new_redirect';
export const REDIRECT_TTL_MS = 5000;

export interface EditorTabItem {
  draftId: string;
  title: string;
  isDraft?: boolean;
}

export function loadAgentEditorTabs(): EditorTabItem[] {
  try {
    const raw = sessionStorage.getItem(AGENT_EDITOR_TABS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as EditorTabItem[];
    if (!Array.isArray(list)) return [];
    return list
      .filter((t) => t.draftId && getAgentDraft(t.draftId))
      .map((t) => ({
        ...t,
        isDraft: getAgentDraft(t.draftId)?.status === 'draft',
      }));
  } catch {
    return [];
  }
}

export function persistAgentEditorTabs(tabs: EditorTabItem[]) {
  sessionStorage.setItem(AGENT_EDITOR_TABS_KEY, JSON.stringify(tabs));
}

export function defaultAgentTabTitle(draftId: string): string {
  return getAgentDraft(draftId)?.title.trim() || '未命名草稿';
}
