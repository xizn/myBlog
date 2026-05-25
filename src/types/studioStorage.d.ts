/** Electron 主进程 JSON 文件存储（由 preload 注入） */
export interface StudioFileStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => { ok: true } | { ok: false; error: string };
  removeItem: (key: string) => { ok: true } | { ok: false; error: string };
  listKeys: () => string[];
  getDataDir: () => string;
}

/** Electron 主进程代发 HTTP（避免浏览器 CORS） */
export interface StudioAiFetchOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export interface StudioAiFetchResult {
  ok: boolean;
  status: number;
  text: string;
  error?: string;
}

declare global {
  interface Window {
    studioFileStorage?: StudioFileStorage;
    studioAiFetch?: (options: StudioAiFetchOptions) => Promise<StudioAiFetchResult>;
  }
}

export {};
