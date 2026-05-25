import type { AgentFormValues } from '@/components/form/AgentForm';

/** 判断 Agent 草稿是否有实质内容 */
export function hasAgentDraftContent(values: AgentFormValues): boolean {
  return Boolean(
    values.title.trim() ||
      values.summary.trim() ||
      values.description.trim() ||
      values.tags.trim() ||
      values.repoUrl.trim() ||
      values.previewUrl.trim() ||
      values.featured ||
      values.status !== 'active' ||
      values.previewType !== 'none'
  );
}
