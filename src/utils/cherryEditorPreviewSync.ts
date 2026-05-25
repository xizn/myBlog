import type { CherryInstance } from '@/utils/cherryMarkdownLoader';
import { getCodeMirrorFromHost, type CodeMirrorEditor } from '@/utils/cherryCodeMirror';

export type CherryPreviewerSync = {
  scrollToLineNum: (lineNum: number | null, linePercent?: number) => void;
  scrollToTop?: (scrollTop: number, behavior?: 'auto' | 'smooth' | 'instant') => void;
  highlightLine?: (lineNum: number) => void;
};

/** Cherry 行号联动（备用） */
function syncPreviewByLine(cm: CodeMirrorEditor, previewer: CherryPreviewerSync): void {
  const scroller = cm.getScrollerElement();

  if (scroller.scrollTop <= 0) {
    previewer.scrollToLineNum(0);
    return;
  }

  if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 20) {
    previewer.scrollToLineNum(null);
    return;
  }

  const currentTop = cm.getScrollInfo().top;
  const targetLine = cm.lineAtHeight(currentTop, 'local');
  const lineRect = cm.charCoords({ line: targetLine, ch: 0 }, 'local');
  const lineHeight = cm.getLineHandle(targetLine).height;
  const lineTop = lineRect.bottom - lineHeight;
  const percent = lineHeight > 0 ? (currentTop - lineTop) / lineHeight : 0;

  previewer.scrollToLineNum(targetLine + 1, percent);
  previewer.highlightLine?.(targetLine + 1);
}

/** 按比例同步预览 scrollTop（主路径，用户滚动时最稳定） */
function syncPreviewByRatio(editorScroller: HTMLElement, previewEl: HTMLElement): boolean {
  const maxEditor = editorScroller.scrollHeight - editorScroller.clientHeight;
  const maxPreview = previewEl.scrollHeight - previewEl.clientHeight;
  if (maxEditor <= 4 || maxPreview <= 4) return false;

  const ratio = editorScroller.scrollTop / maxEditor;
  previewEl.scrollTop = ratio * maxPreview;
  return true;
}

/**
 * 绑定编辑区 → 预览区滚动联动
 * 主：比例同步；备：Cherry 行号同步
 */
export function bindCherryEditorPreviewScroll(
  hostId: string,
  cherry: CherryInstance | null | undefined
): () => void {
  const host = document.getElementById(hostId);
  const previewEl = host?.querySelector('.cherry-previewer') as HTMLElement | null;
  const cm = getCodeMirrorFromHost(hostId);
  const previewer = cherry?.previewer;
  if (!previewEl || !cm) return () => {};

  const scroller = cm.getScrollerElement();
  let raf = 0;

  const runSync = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const ok = syncPreviewByRatio(scroller, previewEl);
      if (!ok && previewer) {
        syncPreviewByLine(cm, previewer);
      }
    });
  };

  scroller.addEventListener('scroll', runSync, { passive: true });
  cm.on('scroll', runSync);

  return () => {
    cancelAnimationFrame(raf);
    scroller.removeEventListener('scroll', runSync);
    cm.off('scroll', runSync);
  };
}
