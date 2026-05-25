function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function fileLooksLikeImage(file: File): boolean {
  if (file.type?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name ?? '');
}

/** 剪贴板是否包含图片 */
export function clipboardHasImage(e: ClipboardEvent): boolean {
  const dt = e.clipboardData;
  if (!dt) return false;

  const types = dt.types ? Array.from(dt.types) : [];
  if (types.some((t) => t === 'Files' || t.startsWith('image/'))) return true;

  if (dt.files?.length) {
    for (let i = 0; i < dt.files.length; i++) {
      if (fileLooksLikeImage(dt.files[i]!)) return true;
    }
  }

  if (dt.items?.length) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (!item) continue;
      if (item.kind === 'file' && (item.type.startsWith('image/') || item.type === '')) return true;
    }
  }

  return false;
}

async function readBlobFromClipboardItem(item: DataTransferItem): Promise<string | null> {
  const file = item.getAsFile();
  if (file && fileLooksLikeImage(file)) {
    return blobToDataUrl(file);
  }
  return null;
}

/** 桌面/Electron：navigator.clipboard.read 兜底 */
async function readClipboardViaNavigator(): Promise<string | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (!type.startsWith('image/')) continue;
        const blob = await item.getType(type);
        const url = await blobToDataUrl(blob);
        if (url) return url;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** 从剪贴板读取图片并转为 data URL */
export async function readClipboardImage(e: ClipboardEvent): Promise<string | null> {
  const dt = e.clipboardData;
  if (dt?.files?.length) {
    for (let i = 0; i < dt.files.length; i++) {
      const file = dt.files[i];
      if (file && fileLooksLikeImage(file)) {
        const url = await blobToDataUrl(file);
        if (url) return url;
      }
    }
  }

  const items = dt?.items;
  if (items?.length) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || item.kind !== 'file') continue;
      const url = await readBlobFromClipboardItem(item);
      if (url) return url;
    }
  }

  return readClipboardViaNavigator();
}

/** 从拖拽或文件选择读取图片 */
export async function readImageFile(file: File | null | undefined): Promise<string | null> {
  if (!file || !fileLooksLikeImage(file)) return null;
  return blobToDataUrl(file);
}

/** 从拖拽文件列表读取图片 */
export async function readDroppedImage(files: FileList | null): Promise<string | null> {
  if (!files?.length) return null;
  for (let i = 0; i < files.length; i++) {
    const url = await readImageFile(files[i]);
    if (url) return url;
  }
  return null;
}

/** 在光标处插入文本 */
export function insertAtCursor(
  text: string,
  insert: string,
  start: number,
  end: number
): { value: string; selectionStart: number; selectionEnd: number } {
  const value = text.slice(0, start) + insert + text.slice(end);
  const pos = start + insert.length;
  return { value, selectionStart: pos, selectionEnd: pos };
}

/** 简易撤销栈（受控 textarea 的 Ctrl+Z / Ctrl+Y） */
export class TextUndoStack {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private readonly limit: number;

  constructor(limit = 50) {
    this.limit = limit;
  }

  push(before: string): void {
    this.undoStack.push(before);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(current: string): string | null {
    const prev = this.undoStack.pop();
    if (prev === undefined) return null;
    this.redoStack.push(current);
    return prev;
  }

  redo(current: string): string | null {
    const next = this.redoStack.pop();
    if (next === undefined) return null;
    this.undoStack.push(current);
    return next;
  }
}
