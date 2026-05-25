import type { AgentProject } from '@/types/agent';
import type { LearningRecord } from '@/types/learning';

/** 按关键词筛选（匹配标题、正文、标签、id 等拼接文本） */
export function filterByKeyword<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
}

/** 学习记录可检索文本 */
export function getLearningSearchText(record: LearningRecord): string {
  return [record.id, record.title, record.summary, record.content, ...record.tags].join(' ');
}

/** Agent 项目可检索文本 */
export function getAgentSearchText(project: AgentProject): string {
  return [
    project.id,
    project.title,
    project.summary,
    project.description,
    project.status,
    project.repoUrl ?? '',
    project.previewUrl ?? '',
    ...project.tags,
  ].join(' ');
}
