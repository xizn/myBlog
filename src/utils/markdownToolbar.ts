export type MarkdownToolbarAction =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'link'
  | 'code'
  | 'quote'
  | 'hr';

export interface MarkdownEditResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function wrapSelection(
  text: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string
): MarkdownEditResult {
  const selected = text.slice(start, end) || placeholder;
  const value = text.slice(0, start) + before + selected + after + text.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return { value, selectionStart: cursorStart, selectionEnd: cursorEnd };
}

function prefixLines(
  text: string,
  start: number,
  end: number,
  prefix: string
): MarkdownEditResult {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = text.indexOf('\n', end);
  const blockEnd = lineEnd === -1 ? text.length : lineEnd;
  const block = text.slice(lineStart, blockEnd);
  const lines = block.split('\n');
  const next = lines.map((line) => (line ? `${prefix}${line}` : prefix.trimEnd())).join('\n');
  const value = text.slice(0, lineStart) + next + text.slice(blockEnd);
  return { value, selectionStart: lineStart, selectionEnd: lineStart + next.length };
}

/** 在光标处插入 Markdown 片段 */
export function applyMarkdownToolbarAction(
  text: string,
  start: number,
  end: number,
  action: MarkdownToolbarAction
): MarkdownEditResult {
  switch (action) {
    case 'bold':
      return wrapSelection(text, start, end, '**', '**', '粗体');
    case 'italic':
      return wrapSelection(text, start, end, '*', '*', '斜体');
    case 'code':
      return wrapSelection(text, start, end, '`', '`', 'code');
    case 'link':
      return wrapSelection(text, start, end, '[', '](https://)', '链接文字');
    case 'h1':
      return prefixLines(text, start, end, '# ');
    case 'h2':
      return prefixLines(text, start, end, '## ');
    case 'h3':
      return prefixLines(text, start, end, '### ');
    case 'ul':
      return prefixLines(text, start, end, '- ');
    case 'ol':
      return prefixLines(text, start, end, '1. ');
    case 'quote':
      return prefixLines(text, start, end, '> ');
    case 'hr': {
      const insert = '\n\n---\n\n';
      const value = text.slice(0, end) + insert + text.slice(end);
      const pos = end + insert.length;
      return { value, selectionStart: pos, selectionEnd: pos };
    }
    default:
      return { value: text, selectionStart: start, selectionEnd: end };
  }
}
