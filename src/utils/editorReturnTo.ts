import { useLocation } from 'react-router-dom';

export type EditorReturnState = { returnTo?: string };

/** 从路由 state 解析返回路径，仅接受站内绝对路径 */
export function resolveReturnTo(state: unknown, fallback: string): string {
  if (state && typeof state === 'object' && 'returnTo' in state) {
    const v = (state as EditorReturnState).returnTo;
    if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//')) {
      return v;
    }
  }
  return fallback;
}

export function editorReturnState(returnTo: string): EditorReturnState {
  return { returnTo };
}

/** 当前页 pathname + search，作为进入编辑页时的 returnTo */
export function currentReturnPath(location: {
  pathname: string;
  search: string;
}): string {
  return location.pathname + location.search;
}

/** 编辑工作区顶栏「返回」应回到的上一级路由 */
export function useEditorReturnTo(fallback: string): string {
  const location = useLocation();
  return resolveReturnTo(location.state, fallback);
}
