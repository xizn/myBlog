import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ensureLearningEditDraft } from '@/api/learningDrafts';
import { useLearning } from '@/hooks/useLearnings';
import { toLearningFormValues } from '@/components/form/LearningForm';

/** 编辑已发布笔记：确保有草稿并跳转草稿编辑页 */
export function LearningEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { item, loading } = useLearning(id);

  useEffect(() => {
    if (!id || !item) return;
    const draft = ensureLearningEditDraft(id, toLearningFormValues(item));
    navigate(`/learning/draft/${draft.draftId}`, { replace: true });
  }, [id, item, navigate]);

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
