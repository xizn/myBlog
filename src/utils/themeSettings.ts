import type { ThemePreset, ThemeSettings } from '@/types/themeSettings';
import {
  accentFromBackground,
  contrastMutedOn,
  contrastSubtleOn,
  contrastTextOn,
  hexToRgba,
  isDarkBackground,
  mixHexWithBlack,
  mixHexWithWhite,
  parseHexColor,
  tintedDarkGlass,
  tintedLightGlass,
} from '@/utils/colorUtils';
import { analyzeImageZoneLuminance } from '@/utils/imageLuminance';
import { getStorageItem, setStorageItem } from '@/utils/appStorage';

const STORAGE_KEY = 'myblog_theme_settings';

/** 防止背景图亮度分析的异步结果覆盖较新的主题设置 */
let themeToneGeneration = 0;

export const DEFAULT_THEME: ThemeSettings = {
  backgroundColor: '#f8f7f4',
  glowColor: '#c4a574',
  backgroundImage: '',
  backgroundImageSize: 'cover',
  backgroundImageOpacity: 35,
  backgroundSurfaceMode: 'glass',
  backgroundImageTextMode: 'auto',
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', name: '默认暖色', backgroundColor: '#f8f7f4', glowColor: '#c4a574' },
  { id: 'dark', name: '深色', backgroundColor: '#1c1b19', glowColor: '#9a7b4a' },
  { id: 'cool', name: '清冷蓝', backgroundColor: '#f0f4f8', glowColor: '#7ba3c4' },
  { id: 'mint', name: '薄荷绿', backgroundColor: '#f4f8f5', glowColor: '#6ba88a' },
  { id: 'rose', name: '淡粉', backgroundColor: '#faf5f6', glowColor: '#c49a9a' },
];

/** 读取主题配置 */
export function loadThemeSettings(): ThemeSettings {
  const raw = getStorageItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_THEME };
  try {
    const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
    return normalizeTheme(parsed);
  } catch {
    return { ...DEFAULT_THEME };
  }
}

/** 保存主题配置 */
export function saveThemeSettings(settings: ThemeSettings): void {
  const normalized = normalizeTheme(settings);
  const result = setStorageItem(STORAGE_KEY, JSON.stringify(normalized));
  if (!result.ok) throw new Error(result.error);
}

/** 将主题写入 :root CSS 变量 */
export function applyThemeSettings(settings: ThemeSettings = loadThemeSettings()): void {
  const root = document.documentElement;
  const generation = ++themeToneGeneration;
  const s = normalizeTheme(settings);
  const dark = isDarkBackground(s.backgroundColor);
  const glow = s.glowColor;
  const bg = s.backgroundColor;
  const accent = accentFromBackground(bg);

  const text = contrastTextOn(bg);
  const textMuted = contrastMutedOn(bg, text);
  const bgElevated = dark ? 'rgba(255, 255, 255, 0.07)' : '#ffffff';
  const bgCard = dark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.82)';
  const surfaceInput = dark ? mixHexWithWhite(bg, 0.12) : '#ffffff';
  const surfaceHeader = hexToRgba(dark ? mixHexWithWhite(bg, 0.05) : bg, dark ? 0.88 : 0.92);
  const surfaceSidebar = hexToRgba(dark ? mixHexWithWhite(bg, 0.03) : bg, dark ? 0.82 : 0.75);
  const surfaceEditor = dark ? mixHexWithWhite(bg, 0.07) : mixHexWithWhite(bg, 0.02);
  const surfacePreview = dark ? mixHexWithWhite(bg, 0.1) : '#ffffff';

  root.dataset.themeMode = dark ? 'dark' : 'light';
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--bg-elevated', bgElevated);
  root.style.setProperty('--bg-card', bgCard);
  root.style.setProperty('--border', dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
  root.style.setProperty('--border-hover', dark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.16)');
  root.style.setProperty('--divider', dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.14)');
  root.style.setProperty(
    '--btn-glass-bg',
    dark ? 'rgba(255, 255, 255, 0.12)' : hexToRgba(mixHexWithWhite(bg, 0.04), 0.76)
  );
  root.style.setProperty(
    '--btn-glass-bg-hover',
    dark ? 'rgba(255, 255, 255, 0.18)' : hexToRgba(mixHexWithWhite(bg, 0.06), 0.9)
  );
  root.style.setProperty(
    '--btn-glass-border',
    dark ? 'rgba(255, 255, 255, 0.22)' : hexToRgba(accent, 0.22)
  );
  root.style.setProperty('--btn-glass-text', text);
  root.style.setProperty('--text', text);
  root.style.setProperty('--text-muted', textMuted);
  root.style.setProperty('--text-subtle', contrastSubtleOn(bg, text));
  root.style.setProperty('--placeholder', dark ? 'rgba(245, 244, 240, 0.55)' : 'rgba(90, 85, 78, 0.65)');
  root.style.setProperty(
    '--glass-shadow',
    dark
      ? '0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 12px 40px rgba(0, 0, 0, 0.32)'
      : '0 4px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.65)'
  );
  root.style.setProperty('--text-on-surface-input', contrastTextOn(surfaceInput));
  root.style.setProperty('--header-bg', surfaceHeader);
  root.style.setProperty('--surface-input', surfaceInput);
  root.style.setProperty('--surface-header', surfaceHeader);
  root.style.setProperty('--surface-sidebar', surfaceSidebar);
  root.style.setProperty('--surface-editor', surfaceEditor);
  root.style.setProperty('--surface-preview', surfacePreview);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-dim', hexToRgba(accent, dark ? 0.28 : 0.14));
  root.style.setProperty('--text-on-accent', contrastTextOn(accent));
  root.style.setProperty(
    '--shadow',
    dark ? '0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 8px 32px rgba(0, 0, 0, 0.4)' : '0 16px 48px rgba(0, 0, 0, 0.08)'
  );
  root.style.setProperty('--shadow-hover', hexToRgba(glow, dark ? 0.14 : 0.12));

  root.style.setProperty('--theme-glow-strong', hexToRgba(glow, 0.18));
  root.style.setProperty('--theme-glow-mid', hexToRgba(glow, 0.06));
  root.style.setProperty('--theme-grid', hexToRgba(glow, 0.07));
  root.style.setProperty('--theme-orb-1', hexToRgba(glow, 0.45));
  root.style.setProperty('--theme-orb-2', hexToRgba(glow, 0.28));
  root.style.setProperty('--theme-orb-3', hexToRgba(glow, 0.3));
  root.style.setProperty(
    '--theme-bg-image-opacity',
    String(Math.min(100, Math.max(0, s.backgroundImageOpacity)) / 100)
  );

  if (s.backgroundImage) {
    root.style.setProperty('--theme-bg-image', `url(${JSON.stringify(s.backgroundImage)})`);
    root.style.setProperty('--theme-bg-size', s.backgroundImageSize);
    root.dataset.themeBgImage = '1';
    root.dataset.themeBgSurface = s.backgroundSurfaceMode;
    /* 有背景图时减弱鼠标光晕，避免与图片抢视觉 */
    root.style.setProperty('--theme-glow-strong', hexToRgba(glow, 0.07));
    root.style.setProperty('--theme-glow-mid', hexToRgba(glow, 0.025));
    root.style.setProperty('--theme-grid', hexToRgba(glow, 0.04));
    root.style.setProperty('--theme-orb-1', hexToRgba(glow, 0.16));
    root.style.setProperty('--theme-orb-2', hexToRgba(glow, 0.1));
    root.style.setProperty('--theme-orb-3', hexToRgba(glow, 0.12));
    if (s.backgroundImageTextMode !== 'auto') {
      const imageDark = s.backgroundImageTextMode === 'light';
      root.dataset.themeBgTone = imageDark ? 'dark' : 'light';
      applyImageTonePalette(root, buildImageTonePalette(s.backgroundColor, imageDark));
    }
    void applyBackgroundImageTone(
      s.backgroundImage,
      s.backgroundColor,
      s.backgroundImageOpacity,
      s.backgroundImageTextMode,
      generation
    );
  } else {
    root.style.removeProperty('--theme-bg-image');
    root.style.removeProperty('--theme-bg-size');
    delete root.dataset.themeBgImage;
    delete root.dataset.themeBgSurface;
    delete root.dataset.themeBgTone;
    root.style.setProperty('--theme-glow-strong', hexToRgba(glow, 0.18));
    root.style.setProperty('--theme-glow-mid', hexToRgba(glow, 0.06));
    root.style.setProperty('--theme-grid', hexToRgba(glow, 0.07));
    root.style.setProperty('--theme-orb-1', hexToRgba(glow, 0.45));
    root.style.setProperty('--theme-orb-2', hexToRgba(glow, 0.28));
    root.style.setProperty('--theme-orb-3', hexToRgba(glow, 0.3));
    root.style.removeProperty('--tab-bg');
    root.style.removeProperty('--tab-bg-active');
    root.style.removeProperty('--tab-text');
    root.style.removeProperty('--tab-text-active');
    root.style.removeProperty('--text-subtle');
    root.style.removeProperty('--placeholder');
    root.style.removeProperty('--glass-shadow');
  }
}

interface ImageTonePalette {
  bgCard: string;
  headerBg: string;
  bgElevated: string;
  surfaceHeader: string;
  surfaceSidebar: string;
  surfaceEditor: string;
  surfacePreview: string;
  surfaceInput: string;
  text: '#1c1b19' | '#f5f4f0';
  textMuted: string;
  textSubtle: string;
  textOnSurfaceInput: '#1c1b19' | '#f5f4f0';
  placeholder: string;
  border: string;
  borderHover: string;
  divider: string;
  btnGlassBg: string;
  btnGlassBgHover: string;
  btnGlassBorder: string;
  btnGlassText: string;
  glassShadow: string;
  tabBg: string;
  tabBgActive: string;
  tabText: string;
  tabTextActive: '#1c1b19' | '#f5f4f0';
}

const INPUT_SOLID = 'rgba(255, 255, 255, 0.97)';

/** 有背景图：高级简约磨砂玻璃 + 清晰文字层级 */
function buildImageTonePalette(bgColor: string, imageDark: boolean): ImageTonePalette {
  if (imageDark) {
    const text = '#f5f4f0' as const;
    const cardApprox = mixHexWithBlack(bgColor, 0.78);
    const textMuted = contrastMutedOn(cardApprox, text);
    const textSubtle = contrastSubtleOn(cardApprox, text);

    return {
      bgCard: tintedDarkGlass(bgColor, 0.46),
      headerBg: tintedDarkGlass(bgColor, 0.58),
      bgElevated: 'rgba(255, 255, 255, 0.1)',
      surfaceHeader: tintedDarkGlass(bgColor, 0.58),
      surfaceSidebar: tintedDarkGlass(bgColor, 0.52),
      surfaceEditor: tintedDarkGlass(bgColor, 0.42),
      surfacePreview: INPUT_SOLID,
      surfaceInput: INPUT_SOLID,
      text,
      textMuted,
      textSubtle,
      textOnSurfaceInput: '#1c1b19',
      placeholder: 'rgba(250, 249, 247, 0.58)',
      border: 'rgba(255, 255, 255, 0.16)',
      borderHover: 'rgba(255, 255, 255, 0.28)',
      divider: 'rgba(255, 255, 255, 0.24)',
      btnGlassBg: 'rgba(255, 255, 255, 0.14)',
      btnGlassBgHover: 'rgba(255, 255, 255, 0.22)',
      btnGlassBorder: 'rgba(255, 255, 255, 0.26)',
      btnGlassText: text,
      glassShadow:
        '0 8px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      tabBg: tintedDarkGlass(bgColor, 0.38),
      tabBgActive: 'rgba(255, 255, 255, 0.14)',
      tabText: textMuted,
      tabTextActive: text,
    };
  }

  const text = '#1c1b19' as const;
  const cardApprox = mixHexWithWhite(bgColor, 0.08);
  const textMuted = contrastMutedOn(cardApprox, text);
  const textSubtle = contrastSubtleOn(cardApprox, text);

  return {
    bgCard: tintedLightGlass(bgColor, 0.72),
    headerBg: tintedLightGlass(bgColor, 0.78),
    bgElevated: tintedLightGlass(bgColor, 0.84),
    surfaceHeader: tintedLightGlass(bgColor, 0.78),
    surfaceSidebar: tintedLightGlass(bgColor, 0.74),
    surfaceEditor: tintedLightGlass(bgColor, 0.7),
    surfacePreview: INPUT_SOLID,
    surfaceInput: INPUT_SOLID,
    text,
    textMuted,
    textSubtle,
    textOnSurfaceInput: '#1c1b19',
    placeholder: 'rgba(28, 27, 25, 0.48)',
    border: 'rgba(0, 0, 0, 0.1)',
    borderHover: 'rgba(0, 0, 0, 0.16)',
    divider: 'rgba(0, 0, 0, 0.14)',
    btnGlassBg: tintedLightGlass(bgColor, 0.82),
    btnGlassBgHover: tintedLightGlass(bgColor, 0.92),
    btnGlassBorder: 'rgba(0, 0, 0, 0.14)',
    btnGlassText: text,
    glassShadow:
      '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
    tabBg: tintedLightGlass(bgColor, 0.62),
    tabBgActive: tintedLightGlass(bgColor, 0.88),
    tabText: textMuted,
    tabTextActive: text,
  };
}

function applyImageTonePalette(root: HTMLElement, palette: ImageTonePalette): void {
  root.style.setProperty('--bg-card', palette.bgCard);
  root.style.setProperty('--header-bg', palette.headerBg);
  root.style.setProperty('--bg-elevated', palette.bgElevated);
  root.style.setProperty('--surface-header', palette.surfaceHeader);
  root.style.setProperty('--surface-sidebar', palette.surfaceSidebar);
  root.style.setProperty('--surface-editor', palette.surfaceEditor);
  root.style.setProperty('--surface-preview', palette.surfacePreview);
  root.style.setProperty('--surface-input', palette.surfaceInput);
  root.style.setProperty('--text', palette.text);
  root.style.setProperty('--text-muted', palette.textMuted);
  root.style.setProperty('--text-subtle', palette.textSubtle);
  root.style.setProperty('--text-on-surface-input', palette.textOnSurfaceInput);
  root.style.setProperty('--placeholder', palette.placeholder);
  root.style.setProperty('--border', palette.border);
  root.style.setProperty('--border-hover', palette.borderHover);
  root.style.setProperty('--divider', palette.divider);
  root.style.setProperty('--btn-glass-bg', palette.btnGlassBg);
  root.style.setProperty('--btn-glass-bg-hover', palette.btnGlassBgHover);
  root.style.setProperty('--btn-glass-border', palette.btnGlassBorder);
  root.style.setProperty('--btn-glass-text', palette.btnGlassText);
  root.style.setProperty('--glass-shadow', palette.glassShadow);
  root.style.setProperty('--tab-bg', palette.tabBg);
  root.style.setProperty('--tab-bg-active', palette.tabBgActive);
  root.style.setProperty('--tab-text', palette.tabText);
  root.style.setProperty('--tab-text-active', palette.tabTextActive);
}

/** 根据背景图亮度调整顶栏/标签对比色（保留用户 backgroundColor 色调） */
async function applyBackgroundImageTone(
  dataUrl: string,
  bgColor: string,
  opacity: number,
  textMode: ThemeSettings['backgroundImageTextMode'],
  generation: number
): Promise<void> {
  const root = document.documentElement;
  const zones = await analyzeImageZoneLuminance(dataUrl);
  if (generation !== themeToneGeneration) return;
  if (root.dataset.themeBgImage !== '1') return;
  const baseLum = isDarkBackground(bgColor) ? 0.25 : 0.75;
  const weight = Math.min(100, Math.max(0, opacity)) / 100;
  const effectiveLum = baseLum * (1 - weight) + zones.uiEffective * weight;

  let imageDark: boolean;
  if (textMode === 'light') {
    imageDark = true;
  } else if (textMode === 'dark') {
    imageDark = false;
  } else {
    imageDark = effectiveLum < 0.48;
  }

  root.dataset.themeBgTone = imageDark ? 'dark' : 'light';
  applyImageTonePalette(root, buildImageTonePalette(bgColor, imageDark));
}

function normalizeTheme(parsed: Partial<ThemeSettings>): ThemeSettings {
  const opacity = Number(parsed.backgroundImageOpacity);
  return {
    backgroundColor: normalizeHex(parsed.backgroundColor, DEFAULT_THEME.backgroundColor),
    glowColor: normalizeHex(parsed.glowColor, DEFAULT_THEME.glowColor),
    backgroundImage: typeof parsed.backgroundImage === 'string' ? parsed.backgroundImage : '',
    backgroundImageSize: parsed.backgroundImageSize === 'contain' ? 'contain' : 'cover',
    backgroundImageOpacity: Number.isFinite(opacity)
      ? Math.min(100, Math.max(0, Math.round(opacity)))
      : DEFAULT_THEME.backgroundImageOpacity,
    backgroundSurfaceMode:
      parsed.backgroundSurfaceMode === 'transparent' ? 'transparent' : 'glass',
    backgroundImageTextMode:
      parsed.backgroundImageTextMode === 'light' || parsed.backgroundImageTextMode === 'dark'
        ? parsed.backgroundImageTextMode
        : 'auto',
  };
}

function normalizeHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return fallback;
}

/** 供 color input 使用的 6 位 hex */
export function toColorInputHex(hex: string, fallback: string): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return fallback;
  return `#${[rgb.r, rgb.g, rgb.b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
