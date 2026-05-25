/** 与 Studio 主题 data-theme-mode 对齐 Cherry Markdown 内外主题 */
export function isAppDarkTheme(): boolean {
  return document.documentElement.dataset.themeMode === 'dark';
}

export function getCherryThemeSettings() {
  const dark = isAppDarkTheme();
  return {
    mainTheme: dark ? 'dark' : 'light',
    codeBlockTheme: 'default',
    inlineCodeTheme: dark ? 'black' : 'red',
    toolbarTheme: dark ? 'dark' : 'light',
  };
}

export function syncCherryTheme(cherry: { setTheme?: (theme: string) => void } | null | undefined): void {
  cherry?.setTheme?.(isAppDarkTheme() ? 'dark' : 'light');
}
