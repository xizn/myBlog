import { getLearningDraft } from '@/api/learningDrafts';

export const LEARNING_EDITOR_TABS_KEY = 'myblog_learning_editor_tabs';
export const NEW_LEARNING_REDIRECT_KEY = 'myblog_learning_new_redirect';
export const REDIRECT_TTL_MS = 5000;

export interface EditorTabItem {
  draftId: string;
  title: string;
  /** 草稿未保存时为 true，显示标签圆点 */
  isDraft?: boolean;
}

export function loadLearningEditorTabs(): EditorTabItem[] {
  try {
    const raw = sessionStorage.getItem(LEARNING_EDITOR_TABS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as EditorTabItem[];
    if (!Array.isArray(list)) return [];
    return list
      .filter((t) => t.draftId && getLearningDraft(t.draftId))
      .map((t) => ({
        ...t,
        isDraft: getLearningDraft(t.draftId)?.status === 'draft',
      }));
  } catch {
    return [];
  }
}

export function persistLearningEditorTabs(tabs: EditorTabItem[]) {
  sessionStorage.setItem(LEARNING_EDITOR_TABS_KEY, JSON.stringify(tabs));
}

export function defaultLearningTabTitle(draftId: string): string {
  return getLearningDraft(draftId)?.title.trim() || '未命名草稿';
}
