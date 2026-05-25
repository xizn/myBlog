import type { FormOperation } from './formLog';
import type { LearningFormValues } from '@/components/form/LearningForm';

export type DraftStatus = 'draft' | 'saved';

/** 学习笔记草稿元信息 */
export interface LearningDraftMeta {
  draftId: string;
  /** 编辑已发布笔记时关联的记录 id */
  learningId?: string;
  /** draft=编辑中；saved=已保存发布 */
  status: DraftStatus;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

/** 学习笔记草稿完整记录 */
export interface LearningDraftRecord extends LearningDraftMeta {
  data: LearningFormValues;
  operations: FormOperation[];
}
