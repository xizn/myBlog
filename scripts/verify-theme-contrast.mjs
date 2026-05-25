/**
 * 校验主题文字对比度（无背景图预设 / 有背景图暗色 / 有背景图亮色）
 * 运行: node scripts/verify-theme-contrast.mjs
 */

function parseHex(hex) {
  const raw = hex.trim().replace(/^#/, '');
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

function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixHexWithBlack(hex, amount) {
  const { r, g, b } = parseHex(hex);
  const t = Math.min(1, Math.max(0, amount));
  const mix = (c) => Math.round(c * (1 - t));
  return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function mixHexWithWhite(hex, amount) {
  const { r, g, b } = parseHex(hex);
  const t = Math.min(1, Math.max(0, amount));
  const mix = (c) => Math.round(c + (255 - c) * t);
  return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function isDarkBackground(hex) {
  const { r, g, b } = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

function contrastTextOn(hex) {
  return isDarkBackground(hex) ? '#f5f4f0' : '#1c1b19';
}

function contrastMutedOn(hex, primaryText) {
  const primary = primaryText ?? contrastTextOn(hex);
  if (primary === '#1c1b19') {
    for (const color of ['#3d3b38', '#4a4844', '#5a554e', '#1c1b19']) {
      if (contrastRatio(color, hex) >= 4.5) return color;
    }
    return '#1c1b19';
  }
  for (const color of ['#f0ece4', '#eae6de', '#e2ded6', '#d8d4cc', '#f5f4f0']) {
    if (contrastRatio(color, hex) >= 4.5) return color;
  }
  return '#f5f4f0';
}

function contrastSubtleOn(hex, primaryText) {
  const primary = primaryText ?? contrastTextOn(hex);
  const minRatio = 3.5;
  if (primary === '#1c1b19') {
    for (const color of ['#6e6962', '#5a554e', '#4a4844', '#3d3b38']) {
      if (contrastRatio(color, hex) >= minRatio) return color;
    }
    return contrastMutedOn(hex, primary);
  }
  for (const color of ['#d8d4cc', '#c8c4bc', '#eae6de', '#e2ded6', '#f0ece4']) {
    if (contrastRatio(color, hex) >= minRatio) return color;
  }
  return contrastMutedOn(hex, primary);
}

const PRESETS = [
  { name: '默认暖色', backgroundColor: '#f8f7f4' },
  { name: '深色', backgroundColor: '#1c1b19' },
  { name: '清冷蓝', backgroundColor: '#f0f4f8' },
  { name: '薄荷绿', backgroundColor: '#f4f8f5' },
  { name: '淡粉', backgroundColor: '#faf5f6' },
];

const AA_NORMAL = 4.5;
const AA_SUBTLE = 3.5;

function check(label, fg, bg, min = AA_NORMAL) {
  const ratio = contrastRatio(fg, bg);
  const ok = ratio >= min;
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}: ${ratio.toFixed(2)}:1 (${fg} on ${bg})`);
  return ok;
}

let allOk = true;

console.log('\n=== 无背景图 · 全部预设 ===');
for (const preset of PRESETS) {
  const bg = preset.backgroundColor;
  const text = contrastTextOn(bg);
  const muted = contrastMutedOn(bg, text);
  const subtle = contrastSubtleOn(bg, text);
  console.log(`\n-- ${preset.name} (${bg}) --`);
  allOk = check('正文', text, bg) && allOk;
  allOk = check('次要文字', muted, bg) && allOk;
  allOk = check('辅助文字', subtle, bg, AA_SUBTLE) && allOk;
  allOk = check('输入框文字 on 白底', '#1c1b19', '#ffffff') && allOk;
}

console.log('\n=== 有背景图 · 暗色图（imageDark）===');
const imageDarkCard = mixHexWithBlack('#f8f7f4', 0.78);
const imageDarkText = '#f5f4f0';
const imageDarkMuted = contrastMutedOn(imageDarkCard, imageDarkText);
const imageDarkSubtle = contrastSubtleOn(imageDarkCard, imageDarkText);
allOk = check('正文 on 卡片色调', imageDarkText, imageDarkCard) && allOk;
allOk = check('次要文字 on 卡片色调', imageDarkMuted, imageDarkCard) && allOk;
allOk = check('辅助文字 on 卡片色调', imageDarkSubtle, imageDarkCard, AA_SUBTLE) && allOk;
allOk = check('保存按钮 on 暗色背景', '#1c1b19', '#f0ece4') && allOk;

console.log('\n=== 有背景图 · 亮色图（imageLight）===');
const mintBg = mixHexWithWhite('#f4f8f5', 0.12);
allOk = check('薄荷正文 on 卡片', contrastTextOn(mintBg), mintBg) && allOk;
allOk = check('薄荷次要 on 卡片', contrastMutedOn(mintBg, '#1c1b19'), mintBg) && allOk;
allOk = check('保存按钮 on 亮色背景', '#f5f4f0', '#1c1b19') && allOk;

console.log(`\n${allOk ? 'All contrast checks passed.' : 'Some contrast checks FAILED.'}`);
process.exit(allOk ? 0 : 1);
