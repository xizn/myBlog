import type { CherryInstance } from '@/utils/cherryMarkdownLoader';
import { getCodeMirrorFromHost, type CodeMirrorEditor } from '@/utils/cherryCodeMirror';

export type CherryPreviewerSync = {
  scrollToLineNum: (lineNum: number | null, linePercent?: number) => void;
  scrollToTop?: (scrollTop: number, behavior?: 'auto' | 'smooth' | 'instant') => void;
  highlightLine?: (lineNum: number) => void;
};

type PreviewerWithAnimation = CherryPreviewerSync & {
  animation?: { timer?: number; destinationTop?: number };
};

/** 与 Cherry Previewer.getDomCanScroll 一致，定位真正可滚动的预览容器 */
export function getCherryPreviewScrollElement(previewRoot: HTMLElement): HTMLElement {
  let current: HTMLElement | null = previewRoot;
  while (current) {
    if (
      current.scrollHeight > current.clientHeight ||
      current.clientHeight < window.innerHeight
    ) {
      return current;
    }
    if (current.nodeName === 'BODY') {
      if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
        return document.documentElement;
      }
      return current;
    }
    current = current.parentElement;
  }
  return previewRoot;
}

function cancelPreviewerScrollAnimation(previewer: PreviewerWithAnimation | undefined): void {
  const timer = previewer?.animation?.timer;
  if (timer) {
    cancelAnimationFrame(timer);
    previewer!.animation!.timer = 0;
  }
}

/** 按光标行定位预览（编辑时「所见即所在」） */
function syncPreviewByCursor(cm: CodeMirrorEditor, previewer: CherryPreviewerSync): void {
  const cursor = cm.getCursor();
  const lineNum = cursor.line + 1;
  const lineHandle = cm.getLineHandle(cursor.line);
  const lineHeight = lineHandle.height;
  const lineRect = cm.charCoords({ line: cursor.line, ch: 0 }, 'local');
  const cursorRect = cm.charCoords(cursor, 'local');
  const lineTop = lineRect.bottom - lineHeight;
  const percent =
    lineHeight > 0 ? Math.max(0, Math.min(1, (cursorRect.top - lineTop) / lineHeight)) : 0;

  previewer.scrollToLineNum(lineNum, percent);
  previewer.highlightLine?.(lineNum);
}

/** Cherry 行号联动（与内置 onScroll 算法一致） */
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

/** 按比例即时同步（走 scrollToTop / 真实滚动容器，避免动画与错误节点） */
function syncPreviewByRatio(
  editorScroller: HTMLElement,
  previewScrollEl: HTMLElement,
  previewer?: PreviewerWithAnimation
): boolean {
  const maxEditor = editorScroller.scrollHeight - editorScroller.clientHeight;
  const maxPreview = previewScrollEl.scrollHeight - previewScrollEl.clientHeight;
  if (maxEditor <= 4 || maxPreview <= 4) return false;

  const ratio = editorScroller.scrollTop / maxEditor;
  const targetTop = ratio * maxPreview;

  cancelPreviewerScrollAnimation(previewer);

  if (previewer?.scrollToTop) {
    previewer.scrollToTop(targetTop, 'auto');
    return true;
  }

  previewScrollEl.scrollTop = targetTop;
  return true;
}

/**
 * 绑定编辑区 → 预览区滚动联动
 * 光标移动：按光标行定位；滚动编辑区：按视口顶行定位（Cherry 行号 API）
 */
export function bindCherryEditorPreviewScroll(
  hostId: string,
  cherry: CherryInstance | null | undefined
): () => void {
  const host = document.getElementById(hostId);
  const previewRoot = host?.querySelector('.cherry-previewer') as HTMLElement | null;
  const cm = getCodeMirrorFromHost(hostId);
  const previewer = cherry?.previewer as PreviewerWithAnimation | undefined;
  if (!previewRoot || !cm) return () => {};

  const scroller = cm.getScrollerElement();
  let raf = 0;

  const runScrollSync = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!previewer) {
        const scrollEl = getCherryPreviewScrollElement(previewRoot);
        syncPreviewByRatio(scroller, scrollEl, previewer);
        return;
      }
      cancelPreviewerScrollAnimation(previewer);
      syncPreviewByLine(cm, previewer);
    });
  };

  const runCursorSync = () => {
    if (!previewer) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      cancelPreviewerScrollAnimation(previewer);
      syncPreviewByCursor(cm, previewer);
    });
  };

  scroller.addEventListener('scroll', runScrollSync, { passive: true });
  cm.on('scroll', runScrollSync);
  cm.on('cursorActivity', runCursorSync);
  runCursorSync();

  return () => {
    cancelAnimationFrame(raf);
    scroller.removeEventListener('scroll', runScrollSync);
    cm.off('scroll', runScrollSync);
    cm.off('cursorActivity', runCursorSync);
  };
}
