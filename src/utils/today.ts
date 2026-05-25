/** 返回 ISO 时间戳（用于创建/更新时间，便于精确排序） */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 返回 YYYY-MM-DD 格式日期 */
export function today(): string {
  return nowIso().slice(0, 10);
}
