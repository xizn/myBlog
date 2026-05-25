import type { ThemePreset, ThemeSettings } from '@/types/themeSettings';
import {
  accentFromBackground,
  contrastTextOn,
  hexToRgba,
  isDarkBackground,
  mixHexWithWhite,
  parseHexColor,
  tintedDarkGlass,
  tintedLightGlass,
} from '@/utils/colorUtils';
import { analyzeImageLuminance } from '@/utils/imageLuminance';
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
  const textMuted = dark ? mixHexWithWhite(bg, 0.55) : '#5a554e';
  const bgElevated = dark ? mixHexWithWhite(bg, 0.1) : '#ffffff';
  const bgCard = dark ? hexToRgba(mixHexWithWhite(bg, 0.12), 0.92) : 'rgba(255, 255, 255, 0.82)';
  const surfaceInput = dark ? mixHexWithWhite(bg, 0.14) : '#ffffff';
  const surfaceHeader = hexToRgba(dark ? mixHexWithWhite(bg, 0.06) : bg, 0.92);
  const surfaceSidebar = hexToRgba(dark ? mixHexWithWhite(bg, 0.04) : bg, dark ? 0.88 : 0.75);
  const surfaceEditor = dark ? mixHexWithWhite(bg, 0.08) : mixHexWithWhite(bg, 0.02);
  const surfacePreview = dark ? mixHexWithWhite(bg, 0.12) : '#ffffff';

  root.dataset.themeMode = dark ? 'dark' : 'light';
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--bg-elevated', bgElevated);
  root.style.setProperty('--bg-card', bgCard);
  root.style.setProperty('--border', dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)');
  root.style.setProperty('--border-hover', dark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)');
  root.style.setProperty('--text', text);
  root.style.setProperty('--text-muted', textMuted);
  root.style.setProperty('--text-subtle', dark ? mixHexWithWhite(bg, 0.48) : '#6e6962');
  root.style.setProperty('--placeholder', dark ? 'rgba(245, 244, 240, 0.55)' : 'rgba(90, 85, 78, 0.65)');
  root.style.setProperty(
    '--glass-shadow',
    dark
      ? '0 8px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
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
  root.style.setProperty('--shadow', dark ? '0 16px 48px rgba(0, 0, 0, 0.45)' : '0 16px 48px rgba(0, 0, 0, 0.08)');
  root.style.setProperty('--shadow-hover', hexToRgba(glow, dark ? 0.2 : 0.12));

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
    void applyBackgroundImageTone(
      s.backgroundImage,
      s.backgroundColor,
      s.backgroundImageOpacity,
      generation
    );
  } else {
    root.style.removeProperty('--theme-bg-image');
    root.style.removeProperty('--theme-bg-size');
    delete root.dataset.themeBgImage;
    delete root.dataset.themeBgTone;
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
  glassShadow: string;
  tabBg: string;
  tabBgActive: string;
  tabText: string;
  tabTextActive: '#1c1b19' | '#f5f4f0';
}

const INPUT_SOLID = 'rgba(255, 255, 255, 0.97)';

/** 有背景图：高级简约磨砂玻璃 + 清晰文字层级 */
function buildImageTonePalette(bgColor: string, imageDark: boolean): ImageTonePalette {
  const themeDark = isDarkBackground(bgColor);

  if (imageDark) {
    const text = '#f5f4f0' as const;
    const textMuted = '#e0dcd4';
    const textSubtle = 'rgba(232, 228, 220, 0.88)';

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
      glassShadow:
        '0 8px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      tabBg: tintedDarkGlass(bgColor, 0.38),
      tabBgActive: 'rgba(255, 255, 255, 0.14)',
      tabText: textMuted,
      tabTextActive: text,
    };
  }

  const text = '#1c1b19';
  const textMuted = '#4a4640';
  const textSubtle = 'rgba(74, 70, 64, 0.88)';

  return {
    bgCard: tintedLightGlass(bgColor, 0.44),
    headerBg: tintedLightGlass(bgColor, 0.56),
    bgElevated: tintedLightGlass(bgColor, 0.58),
    surfaceHeader: tintedLightGlass(bgColor, 0.56),
    surfaceSidebar: tintedLightGlass(bgColor, 0.5),
    surfaceEditor: tintedLightGlass(bgColor, 0.48),
    surfacePreview: INPUT_SOLID,
    surfaceInput: themeDark ? mixHexWithWhite(bgColor, 0.12) : INPUT_SOLID,
    text: themeDark ? '#f5f4f0' : text,
    textMuted: themeDark ? mixHexWithWhite(bgColor, 0.58) : textMuted,
    textSubtle: themeDark ? 'rgba(245, 244, 240, 0.78)' : textSubtle,
    textOnSurfaceInput: '#1c1b19',
    placeholder: themeDark ? 'rgba(245, 244, 240, 0.55)' : 'rgba(28, 27, 25, 0.48)',
    border: themeDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.55)',
    borderHover: themeDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.72)',
    glassShadow:
      '0 4px 28px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)',
    tabBg: tintedLightGlass(bgColor, 0.4),
    tabBgActive: tintedLightGlass(bgColor, 0.62),
    tabText: themeDark ? mixHexWithWhite(bgColor, 0.55) : textMuted,
    tabTextActive: themeDark ? '#f5f4f0' : text,
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
  generation: number
): Promise<void> {
  const root = document.documentElement;
  const imageLum = await analyzeImageLuminance(dataUrl);
  if (generation !== themeToneGeneration) return;
  if (root.dataset.themeBgImage !== '1') return;
  const baseLum = isDarkBackground(bgColor) ? 0.25 : 0.75;
  const weight = Math.min(100, Math.max(0, opacity)) / 100;
  const effectiveLum = baseLum * (1 - weight) + imageLum * weight;
  const imageDark = effectiveLum < 0.48;

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
