import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteLearning, updateLearning } from '@/api/learning';
import { useLearning } from '@/hooks/useLearnings';
import { FormFlagToggle } from '@/components/form/FormFlagToggle';
import { MarkdownContent } from '@/components/learning/MarkdownContent';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BackToTopButton } from '@/components/common/BackToTopButton';
import { ExportMenuButton } from '@/components/common/ExportMenuButton';
import { formatDate } from '@/utils/formatDate';
import { formatLastRead } from '@/utils/formatLastRead';
import { learningToExportBlocks } from '@/utils/learningExport';
import '@/components/form/FormFlagToggle.css';
import '@/components/common/PageActions.css';
import './LearningDetailPage.css';

/** 学习记录详情页 */
export function LearningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { item, loading, setItem } = useLearning(id, { recordRead: true });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingFlag, setSavingFlag] = useState(false);

  const persistToBeContinued = async (toBeContinued: boolean) => {
    if (!item || !id) return;
    setSavingFlag(true);
    try {
      const updated = await updateLearning(id, {
        title: item.title,
        summary: item.summary,
        content: item.content,
        tags: item.tags,
        toBeContinued,
      });
      if (updated) setItem(updated);
    } finally {
      setSavingFlag(false);
    }
  };

  /** 确认删除 */
  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const ok = await deleteLearning(id);
    setDeleting(false);
    if (ok) navigate('/learning');
    else setConfirmOpen(false);
  };

  if (loading) return <p className="page-loading">加载中…</p>;
  if (!item) {
    return (
      <div>
        <EmptyState title="文章不存在" />
        <p className="learning-detail__back-wrap">
          <Link to="/learning">返回列表</Link>
        </p>
      </div>
    );
  }

  return (
    <article className="learning-detail">
      <div className="learning-detail__top">
        <Link to="/learning" className="learning-detail__back">
          ← 返回列表
        </Link>
        <div className="detail-actions detail-actions--top">
          <FormFlagToggle
            variant="toolbar"
            label="未完待续"
            pressed={item.toBeContinued}
            disabled={savingFlag || deleting}
            onPressedChange={(v) => void persistToBeContinued(v)}
            title="开启后显示在首页「最近学习」"
          />
          <ExportMenuButton
            baseName={item.title}
            blocks={learningToExportBlocks(item)}
            disabled={deleting}
          />
          <Link to={`/learning/${id}/edit`} state={{ returnTo: location.pathname }}>
            <Button variant="outline">编辑</Button>
          </Link>
          <Button variant="outline" className="btn--danger-outline" onClick={() => setConfirmOpen(true)}>
            删除
          </Button>
        </div>
      </div>

      <header className="learning-detail__header">
        <p className="learning-detail__read">{formatLastRead(item.lastReadAt)}</p>
        <time className="learning-detail__date">更新于 {formatDate(item.updatedAt)}</time>
        <h1 className="learning-detail__title">{item.title}</h1>
        <p className="learning-detail__summary">{item.summary}</p>
        <div className="learning-detail__meta">
          <div className="learning-detail__tags">
            {item.toBeContinued ? <Tag label="未完待续" /> : null}
            {item.tags.map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
        </div>
      </header>
      <MarkdownContent content={item.content} />

      <ConfirmDialog
        open={confirmOpen}
        title="删除笔记"
        message={`确定删除「${item.title}」？此操作不可恢复。`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <BackToTopButton />
    </article>
  );
}
