import type { AgentProject } from '@/types';

/** 解析项目预览地址 */
export function getPreviewSrc(project: AgentProject): string | null {
  if (project.previewType === 'none' || !project.previewUrl) return null;
  return project.previewUrl;
}

/** 是否可预览 */
export function canPreview(project: AgentProject): boolean {
  return project.previewType !== 'none' && Boolean(project.previewUrl);
}
