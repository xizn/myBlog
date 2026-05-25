/** OpenAI 兼容接口的 AI 配置（仅存本地） */
export interface AiSettings {
  apiKey: string;
  /** 如 https://api.openai.com/v1 */
  baseUrl: string;
  model: string;
}
