import { formatDate } from '@/utils/formatDate';

/** 展示上次阅读时间（无记录时返回「尚未阅读」） */
export function formatLastRead(iso: string | undefined): string {
  if (!iso) return '尚未阅读';

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '尚未阅读';

  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return '刚刚阅读';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} 分钟前阅读`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前阅读`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前阅读`;

  return `${formatDate(iso)} 阅读`;
}
