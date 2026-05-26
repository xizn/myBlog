/** 站点基础信息 */
export const SITE = {
  name: 'AIBlog',
  tagline: 'Agent 项目集 · 学习记录',
  author: 'YS',
  description: '存放 Agent 实验项目，记录学习与实践。',
} as const;

/** 导航链接 */
export const NAV_LINKS = [
  { path: '/', label: '首页' },
  { path: '/agents', label: 'Agent 项目' },
  { path: '/learning', label: '学习记录' },
] as const;
