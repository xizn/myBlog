/** 从 Cherry 宿主节点获取 CodeMirror 5 实例 */
export type CodeMirrorEditor = {
  getValue: () => string;
  setSelection: (from: { line: number; ch: number }, to?: { line: number; ch: number }) => void;
  replaceSelection: (text: string) => void;
  focus: () => void;
  scrollIntoView: (pos?: { line: number; ch: number }, margin?: number) => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  getCursor: () => { line: number; ch: number };
  indexFromPos?: (pos: { line: number; ch: number }) => number;
  getScrollerElement: () => HTMLElement;
  getScrollInfo: () => { top: number; left: number };
  lineAtHeight: (height: number, mode?: string) => number;
  charCoords: (pos: { line: number; ch: number }, mode?: string) => { top: number; bottom: number };
  getLineHandle: (line: number) => { height: number };
};

export function getCodeMirrorFromHost(hostId: string): CodeMirrorEditor | null {
  const host = document.getElementById(hostId);
  if (!host) return null;
  const cmEl = host.querySelector('.CodeMirror') as
    | (HTMLElement & { CodeMirror?: CodeMirrorEditor })
    | null;
  return cmEl?.CodeMirror ?? null;
}

/** 字符偏移 → CodeMirror 位置（0-based line/ch） */
export function charOffsetToCmPos(
  text: string,
  offset: number
): { line: number; ch: number } {
  const safe = Math.max(0, Math.min(offset, text.length));
  const before = text.slice(0, safe);
  const lines = before.split('\n');
  const line = lines.length - 1;
  const ch = lines[line]?.length ?? 0;
  return { line, ch };
}

/** CodeMirror 位置 → 字符偏移 */
export function cmIndexFromPos(cm: CodeMirrorEditor, pos: { line: number; ch: number }): number {
  if (cm.indexFromPos) return cm.indexFromPos(pos);
  const lines = cm.getValue().split('\n');
  let index = 0;
  for (let i = 0; i < pos.line && i < lines.length; i++) {
    index += lines[i]!.length + 1;
  }
  if (pos.line < lines.length) {
    index += Math.min(pos.ch, lines[pos.line]!.length);
  }
  return index;
}
