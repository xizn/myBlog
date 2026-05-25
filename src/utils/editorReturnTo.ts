import { useLocation } from 'react-router-dom';

export type EditorReturnState = {
  /** 本页「返回」应去的上一级（通常是刚离开的页面） */
  returnTo?: string;
  /** 从详情预览回到编辑页后，编辑页顶栏「返回」应去的地方 */
  resumeReturnTo?: string;
  /** 从本页返回上一级时，应恢复的上一级页面 state（用于详情→详情链式预览） */
  previousNavState?: EditorReturnState;
};

function isSafeAppPath(path: string | undefined): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

/** 从路由 state 解析返回路径，仅接受站内绝对路径 */
export function resolveReturnTo(state: unknown, fallback: string): string {
  if (state && typeof state === 'object' && 'returnTo' in state) {
    const v = (state as EditorReturnState).returnTo;
    if (isSafeAppPath(v)) return v;
  }
  return fallback;
}

export function resolveResumeReturnTo(state: unknown): string | undefined {
  if (state && typeof state === 'object' && 'resumeReturnTo' in state) {
    const v = (state as EditorReturnState).resumeReturnTo;
    if (isSafeAppPath(v)) return v;
  }
  return undefined;
}

export function editorReturnState(
  returnTo: string,
  resumeReturnTo?: string
): EditorReturnState {
  const next: EditorReturnState = { returnTo };
  if (resumeReturnTo) next.resumeReturnTo = resumeReturnTo;
  return next;
}

/** 当前页 pathname + search */
export function currentReturnPath(location: {
  pathname: string;
  search: string;
}): string {
  return location.pathname + location.search;
}

export function isDraftEditorPath(pathname: string): boolean {
  return (
    /^\/learning\/draft\/[^/]+/.test(pathname) ||
    /^\/agents\/draft\/[^/]+/.test(pathname)
  );
}

/**
 * 从当前页跳转到站内另一页时携带的 state：
 * - returnTo：目标页返回应回到当前页
 * - resumeReturnTo：若当前为编辑页，保留编辑页自身的上一级（如列表）
 */
function snapshotNavState(state: unknown): EditorReturnState | undefined {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) return undefined;
  const s = state as EditorReturnState;
  if (!isSafeAppPath(s.returnTo)) return undefined;
  const snap: EditorReturnState = { returnTo: s.returnTo };
  if (isSafeAppPath(s.resumeReturnTo)) snap.resumeReturnTo = s.resumeReturnTo;
  return snap;
}

export function buildInternalNavState(
  from: { pathname: string; search: string; state: unknown },
  fallbackParent: string
): EditorReturnState {
  const returnTo = currentReturnPath(from);
  const resume =
    resolveResumeReturnTo(from.state) ??
    (isDraftEditorPath(from.pathname)
      ? resolveReturnTo(from.state, fallbackParent)
      : undefined);
  const previousNavState = snapshotNavState(from.state);
  const next: EditorReturnState = { returnTo };
  if (resume) next.resumeReturnTo = resume;
  if (previousNavState) next.previousNavState = previousNavState;
  return next;
}

/** 点击「返回」跳转到 targetPath 时，应附带的 state */
export function backNavStateForReturn(
  locationState: unknown,
  targetPath: string
): EditorReturnState | undefined {
  if (isDraftEditorPath(targetPath)) {
    const resume = resolveResumeReturnTo(locationState);
    if (resume) return editorReturnState(resume);
    return undefined;
  }
  if (locationState && typeof locationState === 'object' && 'previousNavState' in locationState) {
    const prev = (locationState as EditorReturnState).previousNavState;
    if (prev?.returnTo && isSafeAppPath(prev.returnTo)) return prev;
  }
  return undefined;
}

/** 编辑工作区顶栏「返回」应回到的上一级路由 */
export function useEditorReturnTo(fallback: string): string {
  const location = useLocation();
  return resolveReturnTo(location.state, fallback);
}
