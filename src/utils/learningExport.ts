import type { LearningRecord } from '@/types/learning';
import type { ExportBlock } from '@/utils/exportRecord';
import { formatDate } from '@/utils/formatDate';

/** 学习笔记 → 导出块 */
export function learningToExportBlocks(item: LearningRecord): ExportBlock[] {
  const meta = [
    `更新于：${formatDate(item.updatedAt)}`,
    item.tags.length ? `标签：${item.tags.join('、')}` : '',
    item.toBeContinued ? '状态：未完待续' : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    { title: item.title, body: item.summary },
    { title: '元信息', body: meta },
    { title: '正文', body: item.content },
  ];
}
