import { Link, useLocation } from 'react-router-dom';
import { currentReturnPath, editorReturnState } from '@/utils/editorReturnTo';
import type { LearningRecord } from '@/types';
import { formatLastRead } from '@/utils/formatLastRead';
import { Tag } from '@/components/common/Tag';
import './LearningCard.css';

interface LearningCardProps {
  record: LearningRecord;
}

/** 学习记录卡片 */
export function LearningCard({ record }: LearningCardProps) {
  const location = useLocation();
  const listReturn = currentReturnPath(location);

  return (
    <article className="learning-card">
      <Link
        to={`/learning/${record.id}`}
        state={editorReturnState(listReturn)}
        className="learning-card__link"
      >
        <time className="learning-card__date">{formatLastRead(record.lastReadAt)}</time>
        <h3 className="learning-card__title">{record.title}</h3>
        <p className="learning-card__summary">{record.summary}</p>
      </Link>
      <div className="learning-card__meta">
        <div className="learning-card__tags">
          {record.toBeContinued ? <Tag label="未完待续" /> : null}
          {record.tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </div>
      </div>
    </article>
  );
}
