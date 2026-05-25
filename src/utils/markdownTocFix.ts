import GithubSlugger from 'github-slugger';

/** 收集 Markdown 标题与 slug 映射（顺序与 rehype-slug 一致） */
function collectHeadingSlugs(markdown: string): Map<string, string> {
  const slugger = new GithubSlugger();
  const map = new Map<string, string>();

  for (const line of markdown.split('\n')) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const title = match[1].trim();
    if (title === '目录') continue;
    map.set(title, slugger.slug(title));
  }
  return map;
}

/** 修正 AI 生成的目录链接，使其与正文标题 slug 一致 */
export function fixMarkdownTocLinks(markdown: string): string {
  const slugs = collectHeadingSlugs(markdown);
  if (slugs.size === 0) return markdown;

  const lines = markdown.split('\n');
  let inToc = false;

  const fixed = lines.map((line) => {
    if (/^##\s+目录\s*$/.test(line.trim())) {
      inToc = true;
      return line;
    }
    if (inToc && /^##\s+/.test(line.trim()) && !/^##\s+目录/.test(line.trim())) {
      inToc = false;
    }
    if (!inToc) return line;

    const linkMatch = line.match(/^(\s*[-*]\s+\[([^\]]+)\]\()#[^)]*(\).*)$/);
    if (!linkMatch) return line;

    const title = linkMatch[2].trim();
    const slug = slugs.get(title);
    if (!slug) return line;
    return `${linkMatch[1]}#${slug}${linkMatch[3]}`;
  });

  return fixed.join('\n');
}
