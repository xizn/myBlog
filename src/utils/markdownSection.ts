/** 提取指定 ## 标题下的内容（不含该标题行） */
export function extractMarkdownSection(markdown: string, sectionTitle: string): string | null {
  const target = sectionTitle.trim();
  if (!target) return null;

  const lines = markdown.split('\n');
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+?)\s*#*\s*$/);
    if (m && m[1].trim() === target) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return null;

  const sectionLines: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break;
    sectionLines.push(lines[i]);
  }
  return sectionLines.join('\n').trim();
}

/** 替换指定 ## 标题下的内容 */
export function replaceMarkdownSection(
  markdown: string,
  sectionTitle: string,
  newSectionBody: string
): string {
  const target = sectionTitle.trim();
  const lines = markdown.split('\n');
  let start = -1;
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+?)\s*#*\s*$/);
    if (m && m[1].trim() === target) {
      start = i + 1;
      for (let j = start; j < lines.length; j++) {
        if (/^##\s+/.test(lines[j])) {
          end = j;
          break;
        }
      }
      break;
    }
  }
  if (start === -1) return markdown;

  const body = newSectionBody.trim();
  const replacement = body ? body.split('\n') : [''];
  const next = [...lines.slice(0, start), ...replacement, ...lines.slice(end)];
  return next.join('\n');
}

/** 列出所有 ## 级标题 */
export function listMarkdownH2Titles(markdown: string): string[] {
  const titles: string[] = [];
  for (const line of markdown.split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (m) {
      const title = m[1].trim();
      if (title !== '目录') titles.push(title);
    }
  }
  return titles;
}
