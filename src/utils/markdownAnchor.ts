import GithubSlugger from 'github-slugger';

/** 与 GitHub / rehype-slug 一致的标题锚点 id */
export function slugifyHeading(text: string): string {
  const slugger = new GithubSlugger();
  return slugger.slug(text);
}

/** 在当前 Markdown 容器内滚动到锚点（兼容中文与标点标题） */
export function scrollToMarkdownHash(container: HTMLElement, hash: string): boolean {
  const raw = decodeURIComponent(hash.replace(/^#/, ''));
  if (!raw) return false;

  const candidates = [raw, slugifyHeading(raw)];
  const seen = new Set<string>();

  for (const id of candidates) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const el = container.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
  }

  const headings = container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');
  for (const heading of headings) {
    const text = heading.textContent?.trim() ?? '';
    if (text === raw || slugifyHeading(text) === raw || heading.id === raw) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
  }

  return false;
}
