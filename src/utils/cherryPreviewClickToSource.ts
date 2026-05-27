import type { CherryInstance } from '@/utils/cherryMarkdownLoader';
import { getCodeMirrorFromHost } from '@/utils/cherryCodeMirror';

/** 根据预览区点击目标解析对应 Markdown 起始行（0-based） */
export function resolvePreviewClickLine(
  previewMarkdown: HTMLElement,
  target: Element
): { line: number; blockLines: number } | null {
  let block = target.closest('[data-sign]') as HTMLElement | null;

  if (!block) {
    const figure = target.closest('figure');
    if (figure && previewMarkdown.contains(figure)) {
      let prev: Element | null = figure;
      while (prev && prev.parentElement === previewMarkdown) {
        if (prev instanceof HTMLElement && prev.hasAttribute('data-sign')) {
          block = prev;
          break;
        }
        prev = prev.previousElementSibling;
      }
    }
  }

  if (!block) {
    for (const child of previewMarkdown.children) {
      if (child instanceof HTMLElement && child.contains(target) && child.hasAttribute('data-sign')) {
        block = child;
        break;
      }
    }
  }

  if (!block) return null;

  let topBlock = block;
  if (topBlock.parentElement !== previewMarkdown) {
    for (const child of previewMarkdown.children) {
      if (child instanceof HTMLElement && child.contains(target) && child.hasAttribute('data-sign')) {
        topBlock = child;
        break;
      }
    }
  }

  let line = 0;
  for (const child of previewMarkdown.children) {
    if (!(child instanceof HTMLElement) || !child.hasAttribute('data-sign')) continue;
    if (child === topBlock) {
      const blockLines = Math.max(1, parseInt(child.getAttribute('data-lines') || '1', 10) || 1);
      return { line, blockLines };
    }
    line += parseInt(child.getAttribute('data-lines') || '0', 10) || 0;
  }
  return null;
}

function shouldDeferToCherryBubble(target: HTMLElement): boolean {
  if (target.closest('.cherry-table')) return true;
  if (target.closest('.ch-icon-square, .ch-icon-check')) return true;
  if (target.closest('li')?.querySelector('p')?.contains(target)) return true;
  if (target.closest('img') && !target.closest('figure')) return true;
  if (target.closest('[data-type="codeBlock"]')) return true;
  return false;
}

/** 预览区点击/双击 → 定位左侧编辑区对应行 */
export function bindCherryPreviewClickToSource(
  hostId: string,
  cherry: CherryInstance | null | undefined
): () => void {
  const host = document.getElementById(hostId);
  const previewMd = host?.querySelector(
    '.cherry-previewer .cherry-markdown'
  ) as HTMLElement | null;
  if (!previewMd) return () => {};

  const focusEditorAt = (line: number, blockLines: number, selectBlock: boolean) => {
    const cm = getCodeMirrorFromHost(hostId);
    if (!cm) return;
    const endLine = line + blockLines - 1;
    if (selectBlock) {
      cm.setSelection({ line, ch: 0 }, { line: endLine, ch: cm.getLine(endLine).length });
    } else {
      cm.setCursor({ line, ch: 0 });
    }
    cm.focus();
    cm.scrollIntoView({ line, ch: 0 }, 100);
    cherry?.previewer?.highlightLine?.(line + 1);
    cherry?.previewer?.scrollToLineNum?.(line + 1, 0);
  };

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (target.closest('a')) return;
    if (target.closest('.cherry-previewer-bubble, .cherry-previewer-fab')) return;
    if (shouldDeferToCherryBubble(target)) return;

    const resolved = resolvePreviewClickLine(previewMd, target);
    if (!resolved) return;
    focusEditorAt(resolved.line, resolved.blockLines, false);
  };

  const onDblClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('img') && !target.closest('figure')) return;
    if (target.closest('a')) return;
    if (shouldDeferToCherryBubble(target)) return;

    const resolved = resolvePreviewClickLine(previewMd, target);
    if (!resolved) return;
    e.preventDefault();
    focusEditorAt(resolved.line, resolved.blockLines, true);
  };

  previewMd.addEventListener('click', onClick);
  previewMd.addEventListener('dblclick', onDblClick);

  return () => {
    previewMd.removeEventListener('click', onClick);
    previewMd.removeEventListener('dblclick', onDblClick);
  };
}
