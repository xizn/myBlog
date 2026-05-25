/** Markdown 语法速查（表单悬停提示） */
export const MARKDOWN_HINTS = [
  { syntax: '# 标题', desc: '一级标题（##、### 类推）' },
  { syntax: '**粗体**', desc: '加粗文字' },
  { syntax: '*斜体*', desc: '斜体文字' },
  { syntax: '`代码`', desc: '行内代码' },
  { syntax: '- 列表项', desc: '无序列表' },
  { syntax: '1. 列表项', desc: '有序列表' },
  { syntax: '[文字](链接)', desc: '超链接' },
  { syntax: '> 引用', desc: '引用块' },
  { syntax: '---', desc: '分隔线' },
] as const;
