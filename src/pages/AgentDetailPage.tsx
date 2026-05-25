import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteAgent, updateAgent } from '@/api/agents';
import { useAgent } from '@/hooks/useAgents';
import { FormFlagToggle } from '@/components/form/FormFlagToggle';
import { usePreview } from '@/hooks/usePreview';
import { PreviewPanel } from '@/components/agent/PreviewPanel';
import { PreviewModal } from '@/components/agent/PreviewModal';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BackToTopButton } from '@/components/common/BackToTopButton';
import { ExportMenuButton } from '@/components/common/ExportMenuButton';
import { formatDate } from '@/utils/formatDate';
import { formatLastRead } from '@/utils/formatLastRead';
import { agentToExportBlocks } from '@/utils/agentExport';
import { canPreview, getPreviewSrc } from '@/utils/getPreviewSrc';
import { backNavStateForReturn, useEditorReturnTo } from '@/utils/editorReturnTo';
import '@/components/form/FormFlagToggle.css';
import '@/components/common/PageActions.css';
import './AgentDetailPage.css';

/** Agent 项目详情页 */
export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { item, loading, setItem } = useAgent(id, { recordRead: true });
  const preview = usePreview();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingFlag, setSavingFlag] = useState(false);

  const persistFeatured = async (featured: boolean) => {
    if (!item || !id) return;
    setSavingFlag(true);
    try {
      const updated = await updateAgent(id, {
        title: item.title,
        summary: item.summary,
        description: item.description,
        tags: item.tags,
        status: item.status,
        repoUrl: item.repoUrl,
        previewUrl: item.previewUrl,
        previewType: item.previewType,
        featured,
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
    const ok = await deleteAgent(id);
    setDeleting(false);
    if (ok) navigate('/agents');
    else setConfirmOpen(false);
  };

  const returnTo = useEditorReturnTo('/agents');
  const backLinkState = backNavStateForReturn(location.state, returnTo);

  if (loading) return <p className="page-loading">加载中…</p>;
  if (!item) {
    return (
      <div>
        <EmptyState title="项目不存在" />
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/agents">返回项目列表</Link>
        </p>
      </div>
    );
  }

  const previewSrc = getPreviewSrc(item);
  const showPreview = canPreview(item) && previewSrc;

  return (
    <article className="agent-detail">
      <div className="agent-detail__top">
        <Link to={returnTo} state={backLinkState} className="agent-detail__back">
          ← 返回
        </Link>
        <div className="detail-actions detail-actions--top">
          <FormFlagToggle
            variant="toolbar"
            label="精选"
            pressed={Boolean(item.featured)}
            disabled={savingFlag || deleting}
            onPressedChange={(v) => void persistFeatured(v)}
            title="开启后显示在首页「精选 Agent」"
          />
          <ExportMenuButton
            baseName={item.title}
            blocks={agentToExportBlocks(item)}
            disabled={deleting}
          />
          <Link to={`/agents/${id}/edit`} state={{ returnTo: location.pathname }}>
            <Button variant="outline">编辑</Button>
          </Link>
          <Button variant="outline" className="btn--danger-outline" onClick={() => setConfirmOpen(true)}>
            删除
          </Button>
        </div>
      </div>

      <header className="agent-detail__header">
        <span className={`agent-detail__status agent-detail__status--${item.status}`}>
          {item.status}
        </span>
        <h1 className="agent-detail__title">{item.title}</h1>
        <p className="agent-detail__summary">{item.summary}</p>
        <div className="agent-detail__meta">
          <span>{formatLastRead(item.lastReadAt)}</span>
          <span>更新于 {formatDate(item.updatedAt)}</span>
          <div className="agent-detail__tags">
            {item.tags.map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
        </div>
        <div className="agent-detail__actions">
          {showPreview && (
            <Button variant="primary" onClick={() => preview.openPreview(previewSrc!, item.title)}>
              全屏预览
            </Button>
          )}
          {item.repoUrl && (
            <a href={item.repoUrl} target="_blank" rel="noreferrer noopener">
              <Button variant="outline">查看仓库</Button>
            </a>
          )}
        </div>
      </header>

      <section className="agent-detail__body">
        <h2 className="agent-detail__section-title">项目说明</h2>
        <p className="agent-detail__desc">{item.description}</p>
      </section>

      {showPreview && (
        <section className="agent-detail__preview">
          <h2 className="agent-detail__section-title">在线预览</h2>
          <PreviewPanel src={previewSrc!} title={item.title} embedded />
        </section>
      )}

      {!showPreview && (
        <section className="agent-detail__no-preview">
          <p>该项目暂无预览，可查看仓库了解详情。</p>
        </section>
      )}

      <PreviewModal
        open={preview.open}
        src={preview.src}
        title={preview.title}
        onClose={preview.closePreview}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="删除项目"
        message={`确定删除「${item.title}」？此操作不可恢复。`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <BackToTopButton />
    </article>
  );
}
