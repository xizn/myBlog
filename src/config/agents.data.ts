import type { AgentProject } from '@/types';

/** 示例 Agent 项目数据（可替换为 API） */
export const AGENT_PROJECTS: AgentProject[] = [
  {
    id: 'cursor-automation',
    title: 'Cursor Automation',
    summary: '基于 Cursor 的定时任务与 GitHub 触发自动化',
    description:
      '通过 Cursor Automations 将 Agent 工作流接入 CI 与 Webhook，实现代码审查、Issue 分流等场景。',
    tags: ['Cursor', 'Automation', 'CI'],
    status: 'active',
    createdAt: '2026-03-01',
    updatedAt: '2026-05-10',
    repoUrl: 'https://github.com',
    previewUrl: '/previews/demo-agent/index.html',
    previewType: 'local',
    featured: true,
  },
  {
    id: 'rag-assistant',
    title: 'RAG Knowledge Assistant',
    summary: '文档检索增强的问答 Agent',
    description:
      '结合向量数据库与 LLM，对技术文档进行语义检索并生成带来源引用的回答。',
    tags: ['RAG', 'LLM', 'Python'],
    status: 'wip',
    createdAt: '2026-02-15',
    updatedAt: '2026-04-20',
    repoUrl: 'https://github.com',
    previewUrl: 'https://example.com',
    previewType: 'iframe',
    featured: true,
  },
  {
    id: 'code-review-bot',
    title: 'Code Review Bot',
    summary: 'PR 自动审查与建议生成',
    description: '在 Pull Request 阶段自动分析 diff，输出结构化审查意见与安全提示。',
    tags: ['GitHub', 'Review', 'TypeScript'],
    status: 'active',
    createdAt: '2026-01-08',
    updatedAt: '2026-03-28',
    repoUrl: 'https://github.com',
    previewType: 'none',
    featured: false,
  },
];
