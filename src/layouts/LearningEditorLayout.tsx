import { Outlet } from 'react-router-dom';
import { LearningEditorTabsProvider } from '@/contexts/LearningEditorTabsContext';

/** 学习笔记编辑路由：多窗口标签状态 */
export function LearningEditorLayout() {
  return (
    <LearningEditorTabsProvider>
      <Outlet />
    </LearningEditorTabsProvider>
  );
}