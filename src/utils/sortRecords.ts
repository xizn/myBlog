/** 按创建时间倒序（新的在前）；同一天则按 id 倒序作次序兜底 */
export function sortByCreatedAtDesc<T extends { createdAt: string; id?: string }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (b.id ?? '').localeCompare(a.id ?? '');
  });
}

/** 按更新时间倒序（新的在前） */
export function sortByUpdatedAtDesc<
  T extends { updatedAt?: string; createdAt?: string; id?: string },
>(list: T[]): T[] {
  const getTime = (item: T) =>
    new Date(item.updatedAt ?? item.createdAt ?? 0).getTime();
  return [...list].sort((a, b) => {
    const timeDiff = getTime(b) - getTime(a);
    if (timeDiff !== 0) return timeDiff;
    return (b.id ?? '').localeCompare(a.id ?? '');
  });
}

/** 按上次阅读时间倒序（未读过排在后面，再以更新时间为序） */
export function sortByLastReadAtDesc<
  T extends { lastReadAt?: string; updatedAt?: string; createdAt?: string; id?: string },
>(list: T[]): T[] {
  const readTime = (item: T) =>
    item.lastReadAt ? new Date(item.lastReadAt).getTime() : 0;
  const updatedTime = (item: T) =>
    new Date(item.updatedAt ?? item.createdAt ?? 0).getTime();

  return [...list].sort((a, b) => {
    const readDiff = readTime(b) - readTime(a);
    if (readDiff !== 0) return readDiff;
    const updatedDiff = updatedTime(b) - updatedTime(a);
    if (updatedDiff !== 0) return updatedDiff;
    return (b.id ?? '').localeCompare(a.id ?? '');
  });
}
