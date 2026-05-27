import type { CherryInstance } from '@/utils/cherryMarkdownLoader';
import { syncCherryPaneHeights } from '@/utils/cherryPaneLayout';

type CherryPreviewerPaneApi = {
  /** true = 仅编辑（隐藏预览）；false = 仅预览全屏，勿用于「关预览」 */
  editOnly?: (editOnlyMode?: boolean) => void;
  recoverPreviewer?: (dealToolbar?: boolean) => void;
  isPreviewerHidden?: () => boolean;
  setRealLayout?: (editorPct?: string, previewerPct?: string) => void;
  syncVirtualLayoutFromReal?: () => void;
};

/** 预览区是否可见（与 Cherry 眼睛按钮状态一致） */
export function isCherryPreviewerOpen(hostId: string): boolean {
  const host = document.getElementById(hostId);
  const preview = host?.querySelector('.cherry-previewer');
  if (!preview) return false;
  return !preview.classList.contains('cherry-previewer--hidden');
}

/** 打开/关闭预览窗（眼睛按钮同等效果） */
export function setCherryPreviewerOpen(
  hostId: string,
  cherry: CherryInstance | null | undefined,
  open: boolean
): void {
  const previewer = cherry?.previewer as CherryPreviewerPaneApi | undefined;
  if (!previewer) return;

  if (open) {
    if (previewer.isPreviewerHidden?.()) {
      previewer.recoverPreviewer?.(true);
    }
    previewer.setRealLayout?.('50%', '50%');
    previewer.syncVirtualLayoutFromReal?.();
  } else if (!previewer.isPreviewerHidden?.()) {
    previewer.editOnly?.(true);
  }

  syncCherryPaneHeights(hostId, cherry, open);
}

/** 预览应关闭时，防止输入触发 Cherry 再次展开空预览栏 */
export function ensureCherryPreviewerClosed(
  hostId: string,
  cherry: CherryInstance | null | undefined
): void {
  if (!cherry) return;
  if (isCherryPreviewerOpen(hostId)) {
    setCherryPreviewerOpen(hostId, cherry, false);
  }
}
