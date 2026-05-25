import type { CherryInstance } from '@/utils/cherryMarkdownLoader';

type CodeMirrorWithDom = {
  setSize: (w?: string | number, h?: string | number) => void;
  refresh: () => void;
  getWrapperElement: () => HTMLElement;
  getScrollerElement: () => HTMLElement;
};

/** 约束 Cherry 左右栏高度（仅布局，不改主题色） */
export function syncCherryPaneHeights(hostId: string, cherry?: CherryInstance | null): void {
  const host = document.getElementById(hostId);
  if (!host) return;

  const cherryEl = host.querySelector('.cherry') as HTMLElement | null;
  const toolbar = host.querySelector('.cherry-toolbar') as HTMLElement | null;
  const editor = host.querySelector('.cherry-editor') as HTMLElement | null;
  const preview = host.querySelector('.cherry-previewer') as HTMLElement | null;
  if (!cherryEl || !editor || !preview) return;

  const paneH = Math.max(160, cherryEl.clientHeight - (toolbar?.offsetHeight ?? 48));
  const px = `${paneH}px`;

  editor.style.height = px;
  editor.style.maxHeight = px;
  editor.style.minHeight = '0';
  editor.style.overflow = 'hidden';

  preview.style.height = px;
  preview.style.maxHeight = px;
  preview.style.minHeight = '0';
  preview.style.overflowY = 'auto';
  preview.style.overflowX = 'hidden';

  const cmEl = editor.querySelector('.CodeMirror') as
    | (HTMLElement & { CodeMirror?: CodeMirrorWithDom })
    | null;
  const cm = cmEl?.CodeMirror;
  if (cm) {
    const wrapper = cm.getWrapperElement();
    const scroller = cm.getScrollerElement();
    wrapper.style.height = px;
    wrapper.style.maxHeight = px;
    wrapper.style.overflow = 'hidden';
    scroller.style.setProperty('height', px, 'important');
    scroller.style.setProperty('max-height', px, 'important');
    scroller.style.setProperty('overflow-y', 'auto', 'important');
    cm.setSize('100%', paneH);
    cm.refresh();
  }

  const drag = host.querySelector('.cherry-drag') as HTMLElement | null;
  if (drag) {
    drag.classList.add('cherry-drag--hidden');
    drag.style.display = 'none';
  }

  cherry?.previewer?.setRealLayout?.('50%', '50%');
  cherry?.previewer?.syncVirtualLayoutFromReal?.();
}
