import type { AgentProject } from '@/types/agent';
import type { ExportBlock } from '@/utils/exportRecord';
import { formatDate } from '@/utils/formatDate';

const STATUS_LABEL: Record<AgentProject['status'], string> = {
  active: '进行中',
  archived: '已归档',
  wip: '开发中',
};

/** Agent 项目 → 导出块 */
export function agentToExportBlocks(item: AgentProject): ExportBlock[] {
  const meta = [
    `状态：${STATUS_LABEL[item.status] ?? item.status}`,
    `更新于：${formatDate(item.updatedAt)}`,
    item.tags.length ? `标签：${item.tags.join('、')}` : '',
    item.repoUrl ? `仓库：${item.repoUrl}` : '',
    item.previewUrl ? `预览：${item.previewUrl}` : '',
    item.featured ? '精选项目' : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    { title: item.title, body: item.summary },
    { title: '元信息', body: meta },
    { title: '项目说明', body: item.description },
  ];
}
