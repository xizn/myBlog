import { findTextMatches, type TextSearchMatch } from '@/utils/markdownEditorNav';

export type { TextSearchMatch };

export function findMarkdownSearchMatches(
  text: string,
  query: string,
  caseSensitive: boolean
): TextSearchMatch[] {
  return findTextMatches(text, query, { caseSensitive });
}

function isHighlightableTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  return !parent.closest('script, style, svg, mark.markdown-search-mark');
}

function wrapMatchAtOffset(
  root: HTMLElement,
  match: TextSearchMatch,
  isActive: boolean
): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) {
    if (!isHighlightableTextNode(n)) continue;
    const len = n.data.length;
    if (match.index >= offset && match.index < offset + len) {
      const localStart = match.index - offset;
      const localEnd = Math.min(len, localStart + match.length);
      const mark = document.createElement('mark');
      mark.className = isActive
        ? 'markdown-search-mark markdown-search-mark--active'
        : 'markdown-search-mark';
      const after = n.splitText(localEnd);
      const mid = n.splitText(localStart);
      mark.appendChild(mid);
      n.parentNode?.insertBefore(mark, after);
      return;
    }
    offset += len;
  }
}

/** 在容器内高亮检索命中（从后往前包裹，避免偏移错乱） */
export function applySearchHighlights(
  root: HTMLElement,
  matches: TextSearchMatch[],
  activeIndex: number
): void {
  clearSearchHighlights(root);
  if (matches.length === 0) return;

  const sorted = [...matches].sort((a, b) => b.index - a.index);
  for (const match of sorted) {
    const globalIndex = matches.indexOf(match);
    wrapMatchAtOffset(root, match, globalIndex === activeIndex);
  }
}

export function clearSearchHighlights(root: HTMLElement): void {
  root.querySelectorAll('mark.markdown-search-mark').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
    parent.normalize();
  });
}

export function scrollToSearchMatch(
  root: HTMLElement,
  matches: TextSearchMatch[],
  index: number
): void {
  if (matches.length === 0) return;
  const safe = ((index % matches.length) + matches.length) % matches.length;
  const active = root.querySelector('.markdown-search-mark--active');
  if (active instanceof HTMLElement) {
    active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  const m = matches[safe]!;
  const probe = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) {
    const len = n.data.length;
    if (m.index >= offset && m.index < offset + len) {
      probe.setStart(n, m.index - offset);
      probe.setEnd(n, Math.min(len, m.index - offset + m.length));
      const rect = probe.getBoundingClientRect();
      const cr = root.getBoundingClientRect();
      root.scrollTop += rect.top - cr.top - root.clientHeight * 0.35;
      break;
    }
    offset += len;
  }
}
