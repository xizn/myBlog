import type { ThemePreset, ThemeSettings } from '@/types/themeSettings';
import {
  contrastTextOn,
  hexToRgba,
  isDarkBackground,
  mixHexWithBlack,
  mixHexWithWhite,
  parseHexColor,
} from '@/utils/colorUtils';
import { analyzeImageLuminance } from '@/utils/imageLuminance';
import { getStorageItem, setStorageItem } from '@/utils/appStorage';

const STORAGE_KEY = 'myblog_theme_settings';

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
  const s = normalizeTheme(settings);
  const dark = isDarkBackground(s.backgroundColor);
  const glow = s.glowColor;
  const bg = s.backgroundColor;

  const text = contrastTextOn(bg);
  const textMuted = dark ? mixHexWithWhite(bg, 0.55) : mixHexWithBlack(bg, 0.42);
  const bgElevated = dark ? mixHexWithWhite(bg, 0.1) : '#ffffff';
  const bgCard = dark ? hexToRgba(mixHexWithWhite(bg, 0.12), 0.92) : 'rgba(255, 255, 255, 0.82)';
  const surfaceInput = dark ? mixHexWithWhite(bg, 0.14) : '#ffffff';
  const surfaceHeader = hexToRgba(dark ? mixHexWithWhite(bg, 0.06) : bg, 0.92);
  const surfaceSidebar = hexToRgba(dark ? mixHexWithWhite(bg, 0.04) : bg, dark ? 0.88 : 0.75);
  const surfaceEditor = dark ? mixHexWithWhite(bg, 0.08) : mixHexWithWhite(bg, 0.02);
  const surfacePreview = dark ? mixHexWithWhite(bg, 0.12) : '#ffffff';
  const accentOn = contrastTextOn(glow);

  root.dataset.themeMode = dark ? 'dark' : 'light';
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--bg-elevated', bgElevated);
  root.style.setProperty('--bg-card', bgCard);
  root.style.setProperty('--border', dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)');
  root.style.setProperty('--border-hover', dark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)');
  root.style.setProperty('--text', text);
  root.style.setProperty('--text-muted', textMuted);
  root.style.setProperty('--header-bg', surfaceHeader);
  root.style.setProperty('--surface-input', surfaceInput);
  root.style.setProperty('--surface-header', surfaceHeader);
  root.style.setProperty('--surface-sidebar', surfaceSidebar);
  root.style.setProperty('--surface-editor', surfaceEditor);
  root.style.setProperty('--surface-preview', surfacePreview);
  root.style.setProperty('--accent', glow);
  root.style.setProperty('--accent-dim', hexToRgba(glow, dark ? 0.28 : 0.14));
  root.style.setProperty('--text-on-accent', accentOn);
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
    void applyBackgroundImageTone(s.backgroundImage, s.backgroundColor, s.backgroundImageOpacity);
  } else {
    root.style.removeProperty('--theme-bg-image');
    root.style.removeProperty('--theme-bg-size');
    delete root.dataset.themeBgImage;
    delete root.dataset.themeBgTone;
    root.style.removeProperty('--tab-bg');
    root.style.removeProperty('--tab-bg-active');
    root.style.removeProperty('--tab-text');
    root.style.removeProperty('--tab-text-active');
  }
}

/** 根据背景图亮度调整顶栏/标签对比色 */
async function applyBackgroundImageTone(
  dataUrl: string,
  bgColor: string,
  opacity: number
): Promise<void> {
  const root = document.documentElement;
  const imageLum = await analyzeImageLuminance(dataUrl);
  const baseLum = isDarkBackground(bgColor) ? 0.25 : 0.75;
  const weight = Math.min(100, Math.max(0, opacity)) / 100;
  const effectiveLum = baseLum * (1 - weight) + imageLum * weight;
  const imageDark = effectiveLum < 0.48;

  root.dataset.themeBgTone = imageDark ? 'dark' : 'light';

  const tabBg = imageDark ? hexToRgba(mixHexWithBlack(bgColor, 0.35), 0.82) : hexToRgba('#ffffff', 0.78);
  const tabBgActive = imageDark ? hexToRgba(mixHexWithWhite(bgColor, 0.18), 0.92) : hexToRgba('#ffffff', 0.95);
  const tabText = imageDark ? mixHexWithWhite(bgColor, 0.55) : mixHexWithBlack(bgColor, 0.42);
  const tabTextActive = imageDark ? '#f5f4f0' : '#1c1b19';

  root.style.setProperty('--tab-bg', tabBg);
  root.style.setProperty('--tab-bg-active', tabBgActive);
  root.style.setProperty('--tab-text', tabText);
  root.style.setProperty('--tab-text-active', tabTextActive);

  if (imageDark) {
    root.style.setProperty('--bg-card', hexToRgba(mixHexWithBlack(bgColor, 0.25), 0.88));
    root.style.setProperty('--header-bg', hexToRgba(mixHexWithBlack(bgColor, 0.3), 0.88));
  } else {
    root.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.88)');
    root.style.setProperty('--header-bg', hexToRgba(bgColor, 0.88));
  }
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
