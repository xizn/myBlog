/** 博客主题（背景色、鼠标光晕色、可选背景图） */
export interface ThemeSettings {
  backgroundColor: string;
  /** 鼠标跟随光晕主色（hex） */
  glowColor: string;
  /** 自定义背景图（data URL），空字符串表示无 */
  backgroundImage: string;
  backgroundImageSize: 'cover' | 'contain';
  /** 背景图不透明度 0–100 */
  backgroundImageOpacity: number;
  /** 有背景图时编辑区表面：磨砂玻璃 / 透明（仅背景图模式生效） */
  backgroundSurfaceMode: 'glass' | 'transparent';
  /** 有背景图时 UI 文字色调：自动 / 强制浅色 / 强制深色 */
  backgroundImageTextMode: 'auto' | 'light' | 'dark';
}

export interface ThemePreset {
  id: string;
  name: string;
  backgroundColor: string;
  glowColor: string;
}
