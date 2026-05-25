import type { LearningFormValues } from '@/components/form/LearningForm';
import { toLearningFormValues } from '@/components/form/LearningForm';

/** 判断学习笔记草稿是否有实质内容 */
export function hasLearningDraftContent(values: LearningFormValues): boolean {
  return Boolean(values.title.trim() || values.summary.trim() || values.content.trim());
}

export { toLearningFormValues };
