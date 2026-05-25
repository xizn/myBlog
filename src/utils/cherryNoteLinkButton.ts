/** 在 Cherry 工具栏挂载「关联」按钮（与「插入」「画图」同排） */
export function mountCherryNoteLinkButton(
  hostId: string,
  onOpen: () => void
): () => void {
  const host = document.getElementById(hostId);
  const toolbarLeft = host?.querySelector('.cherry-toolbar .toolbar-left');
  if (!toolbarLeft || toolbarLeft.querySelector('.cherry-toolbar-noteLink')) {
    return () => {};
  }

  const split = document.createElement('span');
  split.className = 'cherry-toolbar-button cherry-toolbar-split';
  split.setAttribute('aria-hidden', 'true');

  const btn = document.createElement('span');
  btn.className = 'cherry-toolbar-button cherry-toolbar-noteLink';
  btn.textContent = '关联';
  btn.title = '关联笔记或 Agent 项目';
  btn.setAttribute('role', 'button');
  btn.tabIndex = 0;

  const open = (e?: Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    onOpen();
  };

  btn.addEventListener('click', open);
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      open(e);
    }
  });

  const graphBtn = toolbarLeft.querySelector('.cherry-toolbar-graph');
  const anchor =
    toolbarLeft.querySelector('.cherry-toolbar-shortcutKey') ??
    toolbarLeft.querySelector('.cherry-toolbar-togglePreview');

  if (graphBtn) {
    graphBtn.insertAdjacentElement('afterend', split);
    split.insertAdjacentElement('afterend', btn);
  } else if (anchor) {
    anchor.insertAdjacentElement('beforebegin', split);
    split.insertAdjacentElement('beforebegin', btn);
  } else {
    toolbarLeft.appendChild(split);
    toolbarLeft.appendChild(btn);
  }

  return () => {
    btn.remove();
    split.remove();
  };
}
