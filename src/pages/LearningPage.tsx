import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLearnings } from '@/hooks/useLearnings';
import { LearningCard } from '@/components/learning/LearningCard';
import { Tag } from '@/components/common/Tag';
import { EmptyState } from '@/components/common/EmptyState';
import { filterByTag, extractTags } from '@/utils/filterByTag';
import { filterByKeyword, getLearningSearchText } from '@/utils/filterByKeyword';
import { Button } from '@/components/common/Button';
import { ListSearch } from '@/components/common/ListSearch';
import { LearningDraftBox } from '@/components/learning/LearningDraftBox';
import '@/components/common/PageActions.css';
import './LearningPage.css';

/** 学习记录列表页 */
export function LearningPage() {
  const { items, loading } = useLearnings();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const tags = useMemo(() => extractTags(items), [items]);
  const filtered = useMemo(() => {
    const byTag = filterByTag(items, activeTag);
    return filterByKeyword(byTag, keyword, getLearningSearchText);
  }, [items, activeTag, keyword]);

  const tagFiltered = useMemo(() => filterByTag(items, activeTag), [items, activeTag]);

  return (
    <div className="learning-page">
      <header className="page-header page-header--row">
        <div>
          <h1 className="page-header__title">学习记录</h1>
          <p className="page-header__desc">技术笔记、实践总结与 Agent 开发心得。</p>
        </div>
        <Link to="/learning/new">
          <Button variant="primary">+ 新建笔记</Button>
        </Link>
      </header>

      <LearningDraftBox />

      <ListSearch
        value={keyword}
        onChange={setKeyword}
        placeholder="搜索笔记标题、摘要、正文、标签…"
        resultCount={filtered.length}
        totalCount={tagFiltered.length}
      />

      {tags.length > 0 && (
        <div className="learning-page__filters">
          <Tag label="全部" active={activeTag === null} onClick={() => setActiveTag(null)} />
          {tags.map((t) => (
            <Tag key={t} label={t} active={activeTag === t} onClick={() => setActiveTag(t)} />
          ))}
        </div>
      )}

      {loading ? (
        <p className="page-loading">加载中…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? '暂无记录' : '未找到匹配内容'}
          description={
            items.length === 0
              ? '点击「新建笔记」记录你的学习心得'
              : keyword.trim()
                ? `没有包含「${keyword.trim()}」的笔记，可尝试其他关键词或清除搜索`
                : `没有标签「${activeTag}」的笔记`
          }
        />
      ) : (
        <div className="learning-page__list">
          {filtered.map((r) => (
            <LearningCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
