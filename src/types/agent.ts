/** Agent 项目条目 */
export interface AgentProject {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  status: 'active' | 'archived' | 'wip';
  createdAt: string;
  updatedAt: string;
  repoUrl?: string;
  previewUrl?: string;
  previewType: 'iframe' | 'local' | 'none';
  featured?: boolean;
  /** 上次打开详情页阅读的时间（ISO） */
  lastReadAt?: string;
}
