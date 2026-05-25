import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface PageHeaderState {
  /** 顶栏副标题中的栏目，如「Agent 项目」 */
  section?: string;
  /** 当前操作，如「新建」「编辑」 */
  action?: string;
}

interface PageHeaderContextValue {
  header: PageHeaderState | null;
  setHeader: (header: PageHeaderState | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

/** 供表单页写入顶栏上下文 */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState | null>(null);
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error('usePageHeader must be used within PageHeaderProvider');
  return ctx;
}
