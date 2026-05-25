import { Link, useLocation } from 'react-router-dom';
import { currentReturnPath, editorReturnState } from '@/utils/editorReturnTo';
import type { AgentProject } from '@/types';
import { formatLastRead } from '@/utils/formatLastRead';
import { canPreview } from '@/utils/getPreviewSrc';
import { Tag } from '@/components/common/Tag';
import './AgentCard.css';

interface AgentCardProps {
  project: AgentProject;
  onPreview?: (url: string, title: string) => void;
}

/** Agent 项目卡片 */
export function AgentCard({ project, onPreview }: AgentCardProps) {
  const hasPreview = canPreview(project);
  const location = useLocation();
  const listReturn = currentReturnPath(location);

  return (
    <article className="agent-card">
      <div className="agent-card__header">
        <span className={`agent-card__status agent-card__status--${project.status}`}>
          {project.status}
        </span>
        <time className="agent-card__date">{formatLastRead(project.lastReadAt)}</time>
      </div>
      <Link
        to={`/agents/${project.id}`}
        state={editorReturnState(listReturn)}
        className="agent-card__link"
      >
        <h3 className="agent-card__title">{project.title}</h3>
        <p className="agent-card__summary">{project.summary}</p>
      </Link>
      <div className="agent-card__tags">
        {project.tags.map((t) => (
          <Tag key={t} label={t} />
        ))}
      </div>
      <div className="agent-card__actions">
        <Link
          to={`/agents/${project.id}`}
          state={editorReturnState(listReturn)}
          className="agent-card__detail"
        >
          查看详情 →
        </Link>
        {hasPreview && onPreview && project.previewUrl && (
          <button
            type="button"
            className="agent-card__preview"
            onClick={() => onPreview(project.previewUrl!, project.title)}
          >
            预览
          </button>
        )}
      </div>
    </article>
  );
}
