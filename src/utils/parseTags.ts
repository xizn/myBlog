/** 将逗号分隔字符串解析为标签数组 */
export function parseTags(input: string): string[] {
  return input
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 标签数组转为表单字符串 */
export function tagsToString(tags: string[]): string {
  return tags.join(', ');
}
