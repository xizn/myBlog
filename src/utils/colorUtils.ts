/** 解析 #rgb / #rrggbb */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** hex → rgba 字符串 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return `rgba(154, 123, 74, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** 根据背景亮度判断是否为深色 */
export function isDarkBackground(hex: string): boolean {
  const rgb = parseHexColor(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.45;
}

/** 与黑色混合，amount 0–1 为黑色占比 */
export function mixHexWithBlack(hex: string, amount: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return hex;
  const t = Math.min(1, Math.max(0, amount));
  const r = Math.round(rgb.r * (1 - t));
  const g = Math.round(rgb.g * (1 - t));
  const b = Math.round(rgb.b * (1 - t));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/** 与白色混合，amount 0–1 为白色占比 */
export function mixHexWithWhite(hex: string, amount: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return hex;
  const t = Math.min(1, Math.max(0, amount));
  const r = Math.round(rgb.r + (255 - rgb.r) * t);
  const g = Math.round(rgb.g + (255 - rgb.g) * t);
  const b = Math.round(rgb.b + (255 - rgb.b) * t);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/** 相对亮度（WCAG） */
export function relativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0.5;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** 对比度（1–21） */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 从背景色推导 UI 强调色（按钮、标签等），与鼠标光晕色无关 */
export function accentFromBackground(hex: string): string {
  if (isDarkBackground(hex)) {
    return mixHexWithWhite(hex, 0.38);
  }
  return mixHexWithBlack(hex, 0.52);
}

/** 根据背景色选择对比文字色 */
export function contrastTextOn(hex: string): '#1c1b19' | '#f5f4f0' {
  return isDarkBackground(hex) ? '#f5f4f0' : '#1c1b19';
}

/** 根据背景色选择次要文字色（保证 AA 对比度） */
export function contrastMutedOn(
  hex: string,
  primaryText?: '#1c1b19' | '#f5f4f0'
): string {
  const primary = primaryText ?? contrastTextOn(hex);
  if (primary === '#1c1b19') {
    const candidates = ['#3d3b38', '#4a4844', '#5a554e', '#1c1b19'];
    for (const color of candidates) {
      if (contrastRatio(color, hex) >= 4.5) return color;
    }
    return '#1c1b19';
  }
  const candidates = ['#f0ece4', '#eae6de', '#e2ded6', '#d8d4cc', '#f5f4f0'];
  for (const color of candidates) {
    if (contrastRatio(color, hex) >= 4.5) return color;
  }
  return '#f5f4f0';
}

/** 深色磨砂玻璃（带轻微主题色调） */
export function tintedDarkGlass(bgColor: string, alpha: number): string {
  const rgb = parseHexColor(bgColor);
  const base = { r: 16, g: 16, b: 18 };
  if (!rgb) return `rgba(${base.r}, ${base.g}, ${base.b}, ${alpha})`;
  const r = Math.round(base.r + (rgb.r - base.r) * 0.07);
  const g = Math.round(base.g + (rgb.g - base.g) * 0.07);
  const b = Math.round(base.b + (rgb.b - base.b) * 0.07);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 浅色磨砂玻璃（带轻微主题色调） */
export function tintedLightGlass(bgColor: string, alpha: number): string {
  const rgb = parseHexColor(bgColor);
  if (!rgb) return `rgba(255, 255, 255, ${alpha})`;
  const r = Math.round(255 - (255 - rgb.r) * 0.14);
  const g = Math.round(255 - (255 - rgb.g) * 0.14);
  const b = Math.round(255 - (255 - rgb.b) * 0.14);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
