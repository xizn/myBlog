import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { AgentsPage } from '@/pages/AgentsPage';
import { AgentDetailPage } from '@/pages/AgentDetailPage';
import { AgentEditorLayout } from '@/layouts/AgentEditorLayout';
import { AgentNewPage } from '@/pages/AgentNewPage';
import { AgentEditPage } from '@/pages/AgentEditPage';
import { AgentEditorWorkspace } from '@/pages/AgentEditorWorkspace';
import { LearningPage } from '@/pages/LearningPage';
import { LearningDetailPage } from '@/pages/LearningDetailPage';
import { LearningEditorLayout } from '@/layouts/LearningEditorLayout';
import { LearningNewPage } from '@/pages/LearningNewPage';
import { LearningEditPage } from '@/pages/LearningEditPage';
import { LearningEditorWorkspace } from '@/pages/LearningEditorWorkspace';

/** 应用路由配置（使用 Component 以便切换路由时正确重渲染） */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      {
        Component: AgentEditorLayout,
        children: [
          { path: 'agents/new', Component: AgentNewPage },
          { path: 'agents/draft/:draftId', Component: AgentEditorWorkspace },
        ],
      },
      { path: 'agents/:id/edit', Component: AgentEditPage },
      { path: 'agents', Component: AgentsPage },
      { path: 'agents/:id', Component: AgentDetailPage },
      {
        Component: LearningEditorLayout,
        children: [
          { path: 'learning/new', Component: LearningNewPage },
          { path: 'learning/draft/:draftId', Component: LearningEditorWorkspace },
        ],
      },
      { path: 'learning/:id/edit', Component: LearningEditPage },
      { path: 'learning', Component: LearningPage },
      { path: 'learning/:id', Component: LearningDetailPage },
    ],
  },
]);
