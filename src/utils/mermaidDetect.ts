/** 判断代码块是否为 Mermaid 图（含 Cherry 画图插入的 flow / seq 简写） */

export function isMermaidLanguage(lang: string | undefined): boolean {
  const l = (lang ?? '').toLowerCase().trim();
  return (
    l === 'mermaid' ||
    l === 'flow' ||
    /^flow\s*(lr|rl|td|tb|bt)?$/i.test(l) ||
    l === 'seq' ||
    /^graph(?:\s*(?:lr|rl|td|tb|bt))?$/i.test(l) ||
    l === 'flowchart'
  );
}

export function looksLikeMermaidSource(code: string): boolean {
  const t = code.trim();
  return /^(graph\s+(?:LR|RL|TD|TB|BT|lr|rl|td|tb|bt)|flowchart\b|sequenceDiagram\b|stateDiagram|classDiagram\b|pie\b|gantt\b|erDiagram\b)/i.test(
    t
  );
}

export function normalizeMermaidSource(code: string, lang?: string): string {
  const l = (lang ?? '').toLowerCase().trim();
  const body = code.trim();

  if (l === 'flow' || /^flow\s*(lr|rl|td|tb|bt)?$/i.test(l)) {
    const dir = l.match(/flow\s*(lr|rl|td|tb|bt)/i)?.[1]?.toUpperCase() ?? 'TD';
    if (!/^graph\s/i.test(body)) {
      return `graph ${dir}\n${body}`;
    }
  }

  if (l === 'seq' && !/^sequenceDiagram/i.test(body)) {
    return `sequenceDiagram\n${body}`;
  }

  return body.replace(/(^[\s]*)stateDiagram-v2\n/, '$1stateDiagram\n');
}

/** 导出栅格化：避免 HTML 节点标签（&lt;br&gt;）导致 canvas 污染无法 toDataURL */
export function normalizeMermaidSourceForExport(code: string, lang?: string): string {
  const body = normalizeMermaidSource(code, lang);
  return body.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
}

export function markdownContainsMermaid(content: string): boolean {
  if (/```\s*(?:mermaid|flow|seq)\b/i.test(content)) return true;
  return /```[\s\S]*?```/.test(content) && /^\s*graph\s+(?:LR|RL|TD|TB)/im.test(content);
}
