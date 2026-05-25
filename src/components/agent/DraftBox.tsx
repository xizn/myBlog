import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAgentDrafts, getAgentDraftPath, listAgentDrafts } from '@/api/agentDrafts';
import { DraftBoxPanel } from '@/components/common/DraftBoxPanel';
import { formatOpTime } from '@/utils/formDraft';

/** Agent 草稿箱管理 */
export function DraftBox() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState(() => listAgentDrafts());

  const refresh = () => setDrafts(listAgentDrafts());

  const items = drafts.map((d) => ({
    draftId: d.draftId,
    title: d.title,
    summary: d.summary,
    meta: `${d.agentId ? `编辑项目 · ${d.agentId}` : '新建草稿'} · 更新于 ${formatOpTime(d.updatedAt)}`,
  }));

  return (
    <DraftBoxPanel
      description="未发布的 Agent 项目草稿，支持继续编辑与删除"
      newButtonLabel="+ 新建草稿"
      emptyMessage="暂无草稿，点击「新建草稿」开始编写"
      items={items}
      onNew={() => navigate('/agents/new')}
      onEdit={(draftId) => navigate(getAgentDraftPath(draftId))}
      onDelete={(draftIds) => {
        const deleted = deleteAgentDrafts(draftIds);
        refresh();
        return deleted;
      }}
    />
  );
}
