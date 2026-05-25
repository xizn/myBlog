import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { currentReturnPath, editorReturnState } from '@/utils/editorReturnTo';
import {
  deleteLearningDrafts,
  getLearningDraftPath,
  listLearningDrafts,
} from '@/api/learningDrafts';
import { DraftBoxPanel } from '@/components/common/DraftBoxPanel';
import { formatOpTime } from '@/utils/formDraft';

/** 学习笔记草稿箱 */
export function LearningDraftBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = currentReturnPath(location);
  const [drafts, setDrafts] = useState(() => listLearningDrafts());

  const refresh = () => setDrafts(listLearningDrafts());

  const items = drafts.map((d) => ({
    draftId: d.draftId,
    title: d.title,
    summary: d.summary,
    meta: `${d.kind === 'edit' && d.learningId ? `编辑笔记 · ${d.learningId}` : '新建草稿'} · 更新于 ${formatOpTime(d.savedAt)}`,
  }));

  return (
    <DraftBoxPanel
      description="未发布的学习笔记草稿，可继续编辑或删除"
      newButtonLabel="+ 新建笔记"
      emptyMessage="暂无草稿，点击「新建笔记」开始编写"
      items={items}
      onNew={() =>
        navigate('/learning/new', { state: editorReturnState(returnTo) })
      }
      onEdit={(draftId) =>
        navigate(getLearningDraftPath(draftId), {
          state: editorReturnState(returnTo),
        })
      }
      onDelete={(draftIds) => {
        const deleted = deleteLearningDrafts(draftIds);
        refresh();
        return deleted;
      }}
    />
  );
}
