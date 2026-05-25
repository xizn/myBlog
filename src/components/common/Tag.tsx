import './Tag.css';

interface TagProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

/** 标签徽章 */
export function Tag({ label, active, onClick }: TagProps) {
  const TagEl = onClick ? 'button' : 'span';
  return (
    <TagEl
      type={onClick ? 'button' : undefined}
      className={`tag ${active ? 'tag--active' : ''} ${onClick ? 'tag--clickable' : ''}`}
      onClick={onClick}
    >
      {label}
    </TagEl>
  );
}
