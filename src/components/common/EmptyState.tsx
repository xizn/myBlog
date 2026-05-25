import './EmptyState.css';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
}

/** 空状态占位 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__desc">{description}</p>}
    </div>
  );
}
