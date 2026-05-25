declare global {
  interface Window {
    /** Electron：用系统默认浏览器打开外链 */
    studioShell?: {
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};
