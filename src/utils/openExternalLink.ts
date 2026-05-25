/** 在系统浏览器或新标签页打开站外链接，避免占用应用主窗口 */
export function openExternalLink(url: string): void {
  const safe = url.trim();
  if (!safe) return;

  if (window.studioShell?.openExternal) {
    void window.studioShell.openExternal(safe);
    return;
  }

  const opened = window.open(safe, '_blank', 'noopener,noreferrer');
  if (opened) return;

  const anchor = document.createElement('a');
  anchor.href = safe;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
