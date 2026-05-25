import { useEffect } from 'react';
import { useAgentEditorTabs } from '@/contexts/AgentEditorTabsContext';

/** 新建项目：创建草稿并进入多窗口编辑 */
export function AgentNewPage() {
  const { openNewDraftWithGuard } = useAgentEditorTabs();

  useEffect(() => {
    openNewDraftWithGuard();
  }, [openNewDraftWithGuard]);

  return <p className="page-loading">正在创建草稿…</p>;
}
