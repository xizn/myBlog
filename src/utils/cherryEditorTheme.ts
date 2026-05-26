/** 与 Studio 主题 data-theme-mode 对齐 Cherry Markdown 内外主题 */
export function isAppDarkTheme(): boolean {
  return document.documentElement.dataset.themeMode === 'dark';
}

/** 有背景图时编辑区为白底孤岛，Cherry 工具栏/语法高亮走浅色 */
export function useCherryLightChrome(): boolean {
  const root = document.documentElement;
  return root.dataset.themeBgImage === '1' || !isAppDarkTheme();
}

export function getCherryThemeSettings() {
  const lightChrome = useCherryLightChrome();
  return {
    mainTheme: lightChrome ? 'light' : 'dark',
    codeBlockTheme: 'default',
    inlineCodeTheme: lightChrome ? 'red' : 'black',
    toolbarTheme: lightChrome ? 'light' : 'dark',
  };
}

export function syncCherryTheme(cherry: { setTheme?: (theme: string) => void } | null | undefined): void {
  cherry?.setTheme?.(useCherryLightChrome() ? 'light' : 'dark');
}
