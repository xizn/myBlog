/** 根据偏移量计算行号、列号（1-based） */
export function offsetToLineCol(text: string, offset: number): { line: number; col: number } {
  const safe = Math.max(0, Math.min(offset, text.length));
  const before = text.slice(0, safe);
  const lines = before.split('\n');
  const line = lines.length;
  const col = (lines[lines.length - 1]?.length ?? 0) + 1;
  return { line, col };
}

export interface TextSearchMatch {
  index: number;
  length: number;
}

/** 在正文中查找所有匹配（空查询返回空数组） */
export function findTextMatches(
  text: string,
  query: string,
  options?: { caseSensitive?: boolean }
): TextSearchMatch[] {
  const q = query.trim();
  if (!q) return [];

  const caseSensitive = options?.caseSensitive ?? false;
  const hay = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? q : q.toLowerCase();
  const matches: TextSearchMatch[] = [];
  let from = 0;

  while (from < hay.length) {
    const index = hay.indexOf(needle, from);
    if (index === -1) break;
    matches.push({ index, length: q.length });
    from = index + Math.max(1, needle.length);
  }

  return matches;
}

/** 将 textarea 滚动到指定字符偏移附近 */
export function scrollTextareaToOffset(textarea: HTMLTextAreaElement, offset: number): void {
  const content = textarea.value;
  const style = getComputedStyle(textarea);
  const lineHeight =
    parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.7 || 20;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const lineIndex = content.slice(0, offset).split('\n').length - 1;
  const targetTop = paddingTop + lineIndex * lineHeight - textarea.clientHeight * 0.35;
  textarea.scrollTop = Math.max(0, targetTop);
}
