import type { FormOperation } from './formLog';
import type { AgentFormValues } from '@/components/form/AgentForm';
import type { DraftStatus } from '@/types/learningDraft';

/** Agent 草稿元信息 */
export interface AgentDraftMeta {
  draftId: string;
  agentId?: string;
  status: DraftStatus;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

/** Agent 草稿完整记录 */
export interface AgentDraftRecord extends AgentDraftMeta {
  data: AgentFormValues;
  operations: FormOperation[];
}
