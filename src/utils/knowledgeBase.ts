import { getStorageItem, setStorageItem } from '@/utils/appStorage';

const STORAGE_KEY = 'myblog_ai_knowledge';

export interface KnowledgeEntry {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
}

function loadAll(): KnowledgeEntry[] {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as KnowledgeEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveAll(list: KnowledgeEntry[]): void {
  setStorageItem(STORAGE_KEY, JSON.stringify(list));
}

/** 添加知识库文件 */
export function addKnowledgeFile(name: string, content: string): KnowledgeEntry {
  const entry: KnowledgeEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    content,
    uploadedAt: new Date().toISOString(),
  };
  const list = loadAll();
  list.unshift(entry);
  saveAll(list.slice(0, 30));
  return entry;
}

/** 列出知识库条目 */
export function listKnowledgeEntries(): KnowledgeEntry[] {
  return loadAll();
}

/** 用户指令是否暗示需要查知识库 */
export function shouldQueryKnowledge(instructions: string): boolean {
  const text = instructions.trim();
  if (!text) return false;
  return /知识库|参考资料|文档|检索|查询|根据上传|依据文件/i.test(text);
}

/** 简易关键词检索，返回相关片段 */
export function searchKnowledge(query: string, limit = 5): string[] {
  const terms = query
    .split(/[\s,，、。；;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return [];

  const hits: { score: number; snippet: string }[] = [];

  for (const entry of loadAll()) {
    const lower = entry.content.toLowerCase();
  const nameLower = entry.name.toLowerCase();
    let score = 0;
    for (const term of terms) {
      const t = term.toLowerCase();
      if (nameLower.includes(t)) score += 3;
      if (lower.includes(t)) score += lower.split(t).length - 1;
    }
    if (score <= 0) continue;

    const idx = terms.reduce((best, term) => {
      const i = lower.indexOf(term.toLowerCase());
      return i >= 0 && (best < 0 || i < best) ? i : best;
    }, -1);
    const start = Math.max(0, idx - 120);
    const snippet = `[${entry.name}] ${entry.content.slice(start, start + 400).trim()}…`;
    hits.push({ score, snippet });
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((h) => h.snippet);
}
