import './ListSearch.css';

interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

/** 列表页关键词检索 */
export function ListSearch({
  value,
  onChange,
  placeholder = '搜索标题、简介、标签…',
  resultCount,
  totalCount,
}: ListSearchProps) {
  const showCount =
    value.trim() && resultCount !== undefined && totalCount !== undefined;

  return (
    <div className="list-search">
      <div className="list-search__field">
        <span className="list-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="list-search__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="关键词检索"
        />
        {value && (
          <button
            type="button"
            className="list-search__clear"
            onClick={() => onChange('')}
            aria-label="清除搜索"
          >
            ×
          </button>
        )}
      </div>
      {showCount && (
        <p className="list-search__hint">
          找到 {resultCount} / {totalCount} 条
        </p>
      )}
    </div>
  );
}
