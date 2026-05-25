import { useEffect } from 'react';
import { useLearningEditorTabs } from '@/contexts/LearningEditorTabsContext';

/** 新建笔记：创建草稿并进入多窗口编辑 */
export function LearningNewPage() {
  const { openNewDraftWithGuard } = useLearningEditorTabs();

  useEffect(() => {
    openNewDraftWithGuard();
  }, [openNewDraftWithGuard]);

  return <p className="page-loading">正在创建草稿…</p>;
}
