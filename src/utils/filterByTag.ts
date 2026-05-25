/** 按标签筛选列表 */
export function filterByTag<T extends { tags: string[] }>(
  items: T[],
  tag: string | null
): T[] {
  if (!tag) return items;
  return items.filter((item) => item.tags.includes(tag));
}

/** 从列表提取去重标签 */
export function extractTags<T extends { tags: string[] }>(items: T[]): string[] {
  const set = new Set<string>();
  items.forEach((item) => item.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
