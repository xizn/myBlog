import { getStorageItem, setStorageItem } from '@/utils/appStorage';

/** 从本地存储读取列表，无数据时用种子初始化并写入 */
export function readList<T>(key: string, seed: T[]): T[] {
  try {
    const raw = getStorageItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* 损坏数据回退种子 */
  }
  const result = setStorageItem(key, JSON.stringify(seed));
  if (!result.ok) {
    console.error(`[Studio Blog] 初始化种子数据失败: ${result.error}`);
  }
  return [...seed];
}

/** 写入列表到本地存储（JSON 文件或 localStorage） */
export function writeList<T>(key: string, data: T[]): void {
  const result = setStorageItem(key, JSON.stringify(data));
  if (!result.ok) {
    throw new Error(result.error);
  }
}
