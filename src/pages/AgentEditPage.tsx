import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ensureAgentEditDraft } from '@/api/agentDrafts';
import { useAgent } from '@/hooks/useAgents';
import { toAgentFormValues } from '@/components/form/AgentForm';

/** 编辑项目：创建/关联草稿并跳转草稿编辑页 */
export function AgentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { item, loading } = useAgent(id);

  useEffect(() => {
    if (!item || !id) return;
    const draft = ensureAgentEditDraft(id, toAgentFormValues(item));
    navigate(`/agents/draft/${draft.draftId}`, { replace: true });
  }, [item, id, navigate]);

  if (loading) return <p className="page-loading">加载中…</p>;
  if (!item) {
    return (
      <p>
        项目不存在，<Link to="/agents">返回列表</Link>
      </p>
    );
  }

  return <p className="page-loading">正在打开草稿…</p>;
}
