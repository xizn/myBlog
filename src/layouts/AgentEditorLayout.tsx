import { Outlet } from 'react-router-dom';
import { AgentEditorTabsProvider } from '@/contexts/AgentEditorTabsContext';

/** Agent 编辑路由：多窗口标签状态 */
export function AgentEditorLayout() {
  return (
    <AgentEditorTabsProvider>
      <Outlet />
    </AgentEditorTabsProvider>
  );
}
