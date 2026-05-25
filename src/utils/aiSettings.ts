import type { AiSettings } from '@/types/aiSettings';
import { getStorageItem, setStorageItem } from '@/utils/appStorage';

const STORAGE_KEY = 'myblog_ai_settings';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  apiKey: 'ms-2f735dc9-9acc-485f-a252-b875ea1e26e3',
  baseUrl: 'https://api-inference.modelscope.cn/v1',
  model: 'Qwen/Qwen3-30B-A3B-Instruct-2507',
};

/** 读取 AI 配置 */
export function loadAiSettings(): AiSettings {
  const raw = getStorageItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_AI_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      apiKey: parsed.apiKey?.trim() ?? '',
      baseUrl: parsed.baseUrl?.trim() || DEFAULT_AI_SETTINGS.baseUrl,
      model: parsed.model?.trim() || DEFAULT_AI_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

/** 保存 AI 配置 */
export function saveAiSettings(settings: AiSettings): void {
  const result = setStorageItem(
    STORAGE_KEY,
    JSON.stringify({
      apiKey: settings.apiKey.trim(),
      baseUrl: settings.baseUrl.trim() || DEFAULT_AI_SETTINGS.baseUrl,
      model: settings.model.trim() || DEFAULT_AI_SETTINGS.model,
    })
  );
  if (!result.ok) {
    throw new Error(result.error);
  }
}

/** 是否已配置 API Key */
export function hasAiApiKey(settings: AiSettings = loadAiSettings()): boolean {
  return Boolean(settings.apiKey);
}
