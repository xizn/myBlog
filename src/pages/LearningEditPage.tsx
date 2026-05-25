import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { editorReturnState, resolveReturnTo } from '@/utils/editorReturnTo';
import { ensureLearningEditDraft } from '@/api/learningDrafts';
import { useLearning } from '@/hooks/useLearnings';
import { toLearningFormValues } from '@/components/form/LearningForm';

/** 编辑已发布笔记：确保有草稿并跳转草稿编辑页 */
export function LearningEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { item, loading } = useLearning(id);

  useEffect(() => {
    if (!id || !item) return;
    const draft = ensureLearningEditDraft(id, toLearningFormValues(item));
    const returnTo = resolveReturnTo(location.state, id ? `/learning/${id}` : '/learning');
    navigate(`/learning/draft/${draft.draftId}`, {
      replace: true,
      state: editorReturnState(returnTo),
    });
  }, [id, item, location.state, navigate]);

  if (loading) return <p className="page-loading">加载中…</p>;
  if (!item) {
    return (
      <p>
        记录不存在，<Link to="/learning">返回列表</Link>
      </p>
    );
  }

  return <p className="page-loading">正在打开草稿…</p>;
}
