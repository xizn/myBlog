import '@/components/form/MarkdownSplitEditor.css';
import './MarkdownReaderToolbar.css';

interface MarkdownReaderToolbarProps {
  searchQuery: string;
  searchCaseSensitive: boolean;
  matchIndex: number;
  matchCount: number;
  disabled?: boolean;
  onSearchQueryChange: (value: string) => void;
  onToggleCase: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/** 阅读页正文检索（样式与编辑区一致） */
export function MarkdownReaderToolbar({
  searchQuery,
  searchCaseSensitive,
  matchIndex,
  matchCount,
  disabled,
  onSearchQueryChange,
  onToggleCase,
  onPrev,
  onNext,
}: MarkdownReaderToolbarProps) {
  const countLabel =
    searchQuery.trim() === ''
      ? '输入关键词检索'
      : matchCount === 0
        ? '无匹配'
        : `${matchIndex + 1} / ${matchCount}`;

  return (
    <div className="markdown-reader-toolbar" aria-label="正文检索">
      <input
        type="search"
        className="md-split-editor__search-input markdown-reader-toolbar__input"
        placeholder="检索正文…"
        value={searchQuery}
        disabled={disabled}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) onPrev();
            else onNext();
          }
        }}
      />
      <button
        type="button"
        className={`md-split-editor__search-case${searchCaseSensitive ? ' md-split-editor__search-case--on' : ''}`}
        disabled={disabled}
        aria-label="区分大小写"
        aria-pressed={searchCaseSensitive}
        title={searchCaseSensitive ? '区分大小写（已开启）' : '区分大小写（已关闭）'}
        onClick={onToggleCase}
      >
        Aa
      </button>
      <span className="md-split-editor__search-count">{countLabel}</span>
      <button
        type="button"
        className="md-split-editor__search-nav"
        disabled={disabled || matchCount === 0}
        onClick={onPrev}
        aria-label="上一处"
      >
        ↑
      </button>
      <button
        type="button"
        className="md-split-editor__search-nav"
        disabled={disabled || matchCount === 0}
        onClick={onNext}
        aria-label="下一处"
      >
        ↓
      </button>
    </div>
  );
}
