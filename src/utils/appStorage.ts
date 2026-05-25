const MYBLOG_PREFIX = 'myblog_';

function useFileStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.studioFileStorage);
}

/** 是否使用 JSON 文件存储（Electron 桌面版） */
export function isFileStorageActive(): boolean {
  return useFileStorage();
}

/** 数据目录（仅 Electron），浏览器开发时为 null */
export function getDataDirectory(): string | null {
  if (!useFileStorage()) return null;
  return window.studioFileStorage!.getDataDir();
}

export function getStorageItem(key: string): string | null {
  if (useFileStorage()) return window.studioFileStorage!.getItem(key);
  return localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string): { ok: true } | { ok: false; error: string } {
  if (useFileStorage()) return window.studioFileStorage!.setItem(key, value);
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === 'QuotaExceededError'
        ? '存储空间已满，请清理浏览器数据后重试'
        : err instanceof Error
          ? err.message
          : '无法写入本地存储';
    return { ok: false, error: message };
  }
}

export function removeStorageItem(key: string): void {
  if (useFileStorage()) {
    window.studioFileStorage!.removeItem(key);
    return;
  }
  localStorage.removeItem(key);
}

export function listStorageKeys(): string[] {
  if (useFileStorage()) return window.studioFileStorage!.listKeys();
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

/** 将浏览器 localStorage 中的 myblog_* 数据迁移到 JSON 文件（仅首次、仅 Electron） */
function migrateLocalStorageToFiles(): void {
  if (!useFileStorage()) return;

  const hasFileData = listStorageKeys().some((key) => key.startsWith(MYBLOG_PREFIX));
  if (hasFileData) return;

  let migrated = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(MYBLOG_PREFIX)) continue;
    const value = localStorage.getItem(key);
    if (value === null) continue;
    const result = setStorageItem(key, value);
    if (result.ok) migrated += 1;
  }

  if (migrated > 0) {
    console.info(`[Studio Blog] 已从浏览器缓存迁移 ${migrated} 项数据到 JSON 文件。`);
  }
}

/** 应用启动时调用：迁移旧数据并确保文件存储可用 */
export function initAppStorage(): void {
  migrateLocalStorageToFiles();
  if (useFileStorage()) {
    console.info(`[Studio Blog] 数据目录: ${getDataDirectory()}`);
  }
}
