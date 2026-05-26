/** 导出保存：渲染进程 File System Access API，不经过 Electron 主进程写盘 */

export type ExportDownloadContext = {
  filename: string;
  fileHandle?: FileSystemFileHandle;
  anchor?: HTMLAnchorElement | null;
};

const PICKER_TYPES: Record<string, { description: string; accept: Record<string, string[]> }> = {
  '.txt': { description: '纯文本', accept: { 'text/plain': ['.txt'] } },
  '.docx': {
    description: 'Word 文档',
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  },
  '.pdf': { description: 'PDF', accept: { 'application/pdf': ['.pdf'] } },
};

/** 本轮会话已触发的 anchor 下载名，避免同名触发浏览器「替换」失败 */
const pendingAnchorNames = new Set<string>();

function anchorExportFilename(filename: string): string {
  if (!pendingAnchorNames.has(filename)) {
    pendingAnchorNames.add(filename);
    window.setTimeout(() => pendingAnchorNames.delete(filename), 120_000);
    return filename;
  }
  const dot = filename.lastIndexOf('.');
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : '';
  let n = 1;
  let candidate = `${stem} (${n})${ext}`;
  while (pendingAnchorNames.has(candidate)) {
    n += 1;
    candidate = `${stem} (${n})${ext}`;
  }
  pendingAnchorNames.add(candidate);
  window.setTimeout(() => pendingAnchorNames.delete(candidate), 120_000);
  return candidate;
}

function triggerAnchorDownload(
  blob: Blob,
  filename: string,
  anchor?: HTMLAnchorElement | null
): void {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
  };

  if (typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(file, filename);
    return;
  }

  const url = URL.createObjectURL(file);
  const link = anchor ?? document.createElement('a');
  const owned = !anchor;
  if (owned) {
    link.style.display = 'none';
    document.body.appendChild(link);
  }
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
  );
  if (owned) link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * 在用户点击导出格式的同一手势内调用，保留文件名（showSaveFilePicker）。
 * 不支持时回退为隐藏 <a>（异步完成后下载，文件名可能为 UUID）。
 */
export async function prepareExportDownload(
  filename: string,
  ext: string
): Promise<ExportDownloadContext> {
  const picker = window.showSaveFilePicker;
  if (typeof picker === 'function') {
    const handle = await picker({
      suggestedName: filename,
      types: [PICKER_TYPES[ext] ?? { description: '文件', accept: { '*/*': [ext] } }],
    });
    return { filename, fileHandle: handle };
  }

  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  return { filename, anchor };
}

export function cleanupExportDownload(ctx?: ExportDownloadContext | null): void {
  ctx?.anchor?.remove();
}

/** 将 blob 写入 prepare 阶段选定的位置 */
export async function commitExportDownload(
  ctx: ExportDownloadContext,
  blob: Blob
): Promise<void> {
  if (ctx.fileHandle) {
    const writable = await ctx.fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const downloadName = anchorExportFilename(ctx.filename);
  triggerAnchorDownload(blob, downloadName, ctx.anchor);
}
