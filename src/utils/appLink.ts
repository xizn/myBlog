/** 解析链接：站内路由 / 页内锚点 / 站外 */
export type ResolvedAppLink =
  | { kind: 'hash'; hash: string }
  | { kind: 'internal'; pathname: string; search: string; hash: string }
  | { kind: 'external'; url: string };

const APP_PATH_PREFIXES = ['/learning', '/agents'] as const;

export function isSameOriginAppPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return APP_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** 是否应在应用内用 React Router 跳转 */
export function resolveAppLink(href: string, baseOrigin = window.location.origin): ResolvedAppLink | null {
  const raw = href.trim();
  if (!raw) return null;
  if (raw.startsWith('#')) return { kind: 'hash', hash: raw };

  try {
    const url = new URL(raw, baseOrigin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { kind: 'external', url: url.href };
    }
    if (url.origin !== baseOrigin) {
      return { kind: 'external', url: url.href };
    }
    if (!isSameOriginAppPath(url.pathname)) {
      return { kind: 'external', url: url.href };
    }
    return {
      kind: 'internal',
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    };
  } catch {
    return null;
  }
}

export function internalLinkTo(pathname: string, search: string, hash: string): string {
  return `${pathname}${search}${hash}`;
}
