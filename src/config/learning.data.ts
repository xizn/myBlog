import type { LearningRecord } from '@/types';

/** 示例学习记录数据 */
export const LEARNING_RECORDS: LearningRecord[] = [
  {
    id: 'cursor-subagent',
    title: 'Cursor Subagent 架构实践',
    summary: '如何用 .cursor/agents 定义专用子代理',
    content: `## 背景

Subagent 允许将复杂任务隔离到专用上下文中执行。

## 要点

- 项目级：\`.cursor/agents/\`
- 用户级：\`~/.cursor/agents/\`
- 通过 \`description\` 控制委托时机

## 结论

适合代码审查、前端脚手架、调试等可复用工作流。`,
    tags: ['Cursor', 'Agent'],
    createdAt: '2026-05-12',
    updatedAt: '2026-05-12',
    toBeContinued: true,
  },
  {
    id: 'react-preview-pattern',
    title: '项目预览 iframe 方案',
    summary: '在博客中嵌入 Agent 项目演示',
    content: `## 方案

1. **本地静态页**：放在 \`public/previews/[id]/\`
2. **外部 URL**：\`previewType: iframe\` + \`previewUrl\`
3. **无预览**：展示占位与仓库链接

## 安全

对外链使用 \`sandbox\` 属性限制 iframe 权限。`,
    tags: ['React', 'Frontend'],
    createdAt: '2026-05-08',
    updatedAt: '2026-05-08',
    toBeContinued: false,
  },
];
