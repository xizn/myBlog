/** 根据标题生成唯一 id */
export function generateId(title: string): string {
  const slug =
    title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
      .slice(0, 36) || 'item';
  return `${slug}-${Date.now().toString(36)}`;
}
