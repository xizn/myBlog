import { deleteAgentDraftsByAgentId } from '@/api/agentDrafts';
import { AGENT_PROJECTS } from '@/config/agents.data';
import { STORAGE_KEYS } from '@/constants/storage';
import type { AgentProject } from '@/types';
import { readList, writeList } from '@/utils/localStore';
import { generateId } from '@/utils/generateId';
import { sortByLastReadAtDesc, sortByUpdatedAtDesc } from '@/utils/sortRecords';
import { nowIso } from '@/utils/today';

/** 模拟网络延迟 */
const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

function normalizeAgent(project: AgentProject): AgentProject {
  return { ...project };
}

/** 读取本地 Agent 列表 */
function loadAll(): AgentProject[] {
  return readList(STORAGE_KEYS.agents, AGENT_PROJECTS).map(normalizeAgent);
}

/** 按更新时间倒序（最新在前） */
function sortAgents(list: AgentProject[]): AgentProject[] {
  return sortByUpdatedAtDesc(list);
}

/** 获取全部 Agent 项目 */
export async function fetchAgents(): Promise<AgentProject[]> {
  await delay();
  return sortAgents(loadAll());
}

/** 按 id 获取单个 Agent 项目（不更新阅读时间） */
export async function fetchAgentById(id: string): Promise<AgentProject | null> {
  await delay(50);
  return loadAll().find((p) => p.id === id) ?? null;
}

/** 记录阅读时间并返回最新记录（打开详情页时调用） */
export async function recordAgentRead(id: string): Promise<AgentProject | null> {
  await delay(50);
  const list = loadAll();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: AgentProject = {
    ...list[index]!,
    lastReadAt: nowIso(),
  };
  list[index] = updated;
  writeList(STORAGE_KEYS.agents, list);
  return updated;
}

/** 获取首页展示的 Agent 项目（精选，按上次阅读倒序） */
export async function fetchFeaturedAgents(): Promise<AgentProject[]> {
  const all = await fetchAgents();
  return sortByLastReadAtDesc(all.filter((p) => Boolean(p.featured))).slice(0, 4);
}

export type AgentInput = Omit<AgentProject, 'id' | 'createdAt' | 'updatedAt' | 'lastReadAt'> & {
  id?: string;
};

/** 新建 Agent 项目 */
export async function createAgent(input: AgentInput): Promise<AgentProject> {
  await delay();
  const list = loadAll();
  const now = nowIso();
  const project: AgentProject = {
    ...input,
    id: input.id?.trim() || generateId(input.title),
    createdAt: now,
    updatedAt: now,
  };
  if (list.some((p) => p.id === project.id)) {
    throw new Error('ID 已存在，请更换自定义 ID');
  }
  list.push(project);
  writeList(STORAGE_KEYS.agents, list);
  return project;
}

/** 更新 Agent 项目 */
export async function updateAgent(
  id: string,
  input: AgentInput
): Promise<AgentProject | null> {
  await delay();
  const list = loadAll();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const existing = list[index]!;
  const updated: AgentProject = {
    ...input,
    id,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
    lastReadAt: existing.lastReadAt,
  };
  list[index] = updated;
  writeList(STORAGE_KEYS.agents, list);
  return updated;
}

/** 删除 Agent 项目 */
export async function deleteAgent(id: string): Promise<boolean> {
  await delay();
  const list = loadAll();
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) return false;
  writeList(STORAGE_KEYS.agents, next);
  deleteAgentDraftsByAgentId(id);
  return true;
}
