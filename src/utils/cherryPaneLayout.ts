/** 约束 Cherry 左右栏高度，避免 CodeMirror 把编辑区撑成整块正文高度 */
export function syncCherryPaneHeights(hostId: string): void {
  const host = document.getElementById(hostId);
  if (!host) return;

  const cherry = host.querySelector('.cherry') as HTMLElement | null;
  const toolbar = host.querySelector('.cherry-toolbar') as HTMLElement | null;
  const editor = host.querySelector('.cherry-editor') as HTMLElement | null;
  const preview = host.querySelector('.cherry-previewer') as HTMLElement | null;
  if (!cherry || !editor || !preview) return;

  const paneH = Math.max(160, cherry.clientHeight - (toolbar?.offsetHeight ?? 48));
  const px = `${paneH}px`;

  for (const pane of [editor, preview]) {
    pane.style.height = px;
    pane.style.maxHeight = px;
    pane.style.minHeight = '0';
    pane.style.overflow = pane === preview ? 'auto' : 'hidden';
  }

  const cmWrap = editor.querySelector('.CodeMirror') as
    | (HTMLElement & { CodeMirror?: { setSize: (w?: string | number, h?: string | number) => void; refresh: () => void } })
    | null;

  if (cmWrap?.CodeMirror) {
    cmWrap.style.height = '100%';
    cmWrap.style.maxHeight = '100%';
    cmWrap.CodeMirror.setSize('100%', paneH);
    cmWrap.CodeMirror.refresh();
  }
}
