import type { AiSettings } from '@/types/aiSettings';
import { aiHttpRequest } from '@/utils/aiHttp';
import { fixMarkdownTocLinks } from '@/utils/markdownTocFix';
import {
  extractMarkdownSection,
  listMarkdownH2Titles,
  replaceMarkdownSection,
} from '@/utils/markdownSection';

const SYSTEM_PROMPT = `你是笔记整理助手。将用户提供的零散文字整理为结构清晰、可读的 Markdown 笔记。

基本要求：
- 使用中文（除非原文主要为英文）
- 保留原意，可补全标点与分段，不要编造事实
- 代码片段使用 Markdown 代码块
- 只输出整理后的 Markdown 正文，不要前言、后记或「以下是…」类说明
- 标题层级：正文从 ## 开始；需要更细层次时用 ###

目录（## 目录）规则：
- 根据内容自行判断是否需要目录，不要每篇都加
- 适合添加：整理后有多于 2 个 ## 章节、篇幅较长、层次较多
- 不要添加：内容很短、只有一两个小节、随笔/日记、原文已有合理目录
- 若添加目录：
  1. 放在正文最前（首个 ## 章节之前）
  2. 使用无序列表
  3. 链接格式 [章节标题](#slug)，slug 必须与后文 ## 标题经 GitHub slug 规则生成的锚点完全一致
  4. 目录项必须逐条对应后文真实存在的 ## 标题，不得遗漏或虚构章节
  5. 生成目录后请自检：每个链接的目标标题必须在正文中出现
- 用户明确要求「要/不要目录」时，以用户要求为准

微调模式：
- 若用户指定了「目标章节」，只输出该章节的 Markdown 内容（从 ## 标题开始，含该标题行），不要输出全文
- 微调时保持与同笔记其他章节的风格一致`;

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 去掉 AI 可能包裹的 markdown 代码围栏 */
export function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fenced) return fenced[1].trim();
  const generic = trimmed.match(/^```\s*\r?\n([\s\S]*?)\r?\n```$/);
  if (generic) return generic[1].trim();
  return trimmed;
}

function parseApiError(status: number, text: string): string {
  try {
    const json = JSON.parse(text) as { error?: { message?: string } };
    if (json.error?.message) return json.error.message;
  } catch {
    /* ignore */
  }
  if (status === 401) return 'API Key 无效或未授权';
  if (status === 429) return '请求过于频繁，请稍后再试';
  return `请求失败（HTTP ${status || '网络错误'}）`;
}

/** 调用 OpenAI 兼容接口，将正文整理为 Markdown */
export async function formatMarkdownWithAi(params: {
  rawText: string;
  noteTitle?: string;
  userInstructions?: string;
  /** 多轮对话历史（不含当前轮 user） */
  messages?: AiChatMessage[];
  /** 仅微调指定 ## 章节 */
  targetSection?: string;
  /** 知识库检索片段 */
  knowledgeContext?: string;
  settings: AiSettings;
}): Promise<string> {
  const {
    rawText,
    noteTitle,
    userInstructions,
    messages = [],
    targetSection,
    knowledgeContext,
    settings,
  } = params;
  if (!settings.apiKey.trim()) {
    throw new Error('请先配置 AI API Key');
  }

  const base = settings.baseUrl.replace(/\/$/, '');
  const url = `${base}/chat/completions`;

  const isSectionEdit = Boolean(targetSection?.trim());
  const sectionBody = isSectionEdit
    ? extractMarkdownSection(rawText, targetSection!.trim())
    : null;

  const userParts: string[] = [];
  if (noteTitle?.trim()) userParts.push(`笔记标题：${noteTitle.trim()}`);
  if (knowledgeContext?.trim()) {
    userParts.push(`知识库参考（可结合用户指令使用）：\n${knowledgeContext.trim()}`);
  }
  if (userInstructions?.trim()) userParts.push(`用户整理要求：\n${userInstructions.trim()}`);
  if (isSectionEdit) {
    userParts.push(`目标章节：${targetSection!.trim()}`);
    userParts.push(
      '请只输出该章节的 Markdown（含 ## 标题行）。可参考下方完整笔记上下文，但勿改动其他章节。'
    );
    if (sectionBody) userParts.push(`当前章节内容：\n${sectionBody}`);
    userParts.push(`完整笔记上下文：\n${rawText.trim()}`);
  } else {
    userParts.push('待整理正文：', rawText.trim());
  }

  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userParts.join('\n\n') },
  ];

  const body = JSON.stringify({
    model: settings.model,
    temperature: 0.3,
    messages: chatMessages,
  });

  const result = await aiHttpRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body,
  });

  if (result.error) {
    throw new Error(
      result.error.includes('fetch') || result.error.includes('Failed')
        ? '网络请求失败。桌面版请用 npm run desktop；浏览器开发需 API 支持跨域或使用代理。'
        : result.error
    );
  }

  if (!result.ok) {
    throw new Error(parseApiError(result.status, result.text));
  }

  let json: { choices?: Array<{ message?: { content?: string } }> };
  try {
    json = JSON.parse(result.text);
  } catch {
    throw new Error('AI 返回格式异常');
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('AI 未返回有效内容');
  }

  let markdown = stripMarkdownFences(content);
  if (!markdown) throw new Error('AI 返回内容为空');

  if (isSectionEdit && targetSection?.trim()) {
    let sectionContent = stripMarkdownFences(content);
    sectionContent = sectionContent.replace(/^##\s+.+?\n+/, '').trim();
    markdown = replaceMarkdownSection(rawText, targetSection.trim(), sectionContent);
    return fixMarkdownTocLinks(markdown);
  }

  return fixMarkdownTocLinks(markdown);
}

export { listMarkdownH2Titles };
