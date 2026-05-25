import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { usePreview } from '@/hooks/usePreview';
import { AgentCard } from '@/components/agent/AgentCard';
import { DraftBox } from '@/components/agent/DraftBox';
import { PreviewModal } from '@/components/agent/PreviewModal';
import { Tag } from '@/components/common/Tag';
import { EmptyState } from '@/components/common/EmptyState';
import { filterByTag, extractTags } from '@/utils/filterByTag';
import { filterByKeyword, getAgentSearchText } from '@/utils/filterByKeyword';
import { Button } from '@/components/common/Button';
import { ListSearch } from '@/components/common/ListSearch';
import '@/components/common/PageActions.css';
import './AgentsPage.css';

/** Agent 项目列表页 */
export function AgentsPage() {
  const { items, loading } = useAgents();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const preview = usePreview();

  const tags = useMemo(() => extractTags(items), [items]);
  const filtered = useMemo(() => {
    const byTag = filterByTag(items, activeTag);
    return filterByKeyword(byTag, keyword, getAgentSearchText);
  }, [items, activeTag, keyword]);

  const tagFiltered = useMemo(() => filterByTag(items, activeTag), [items, activeTag]);

  return (
    <div className="agents-page">
      <header className="page-header page-header--row">
        <div>
          <h1 className="page-header__title">Agent 项目</h1>
          <p className="page-header__desc">实验性 Agent 与自动化工作流，支持在线预览演示。</p>
        </div>
        <Link to="/agents/new">
          <Button variant="primary">+ 新建项目</Button>
        </Link>
      </header>

      <DraftBox />

      <ListSearch
        value={keyword}
        onChange={setKeyword}
        placeholder="搜索项目标题、简介、说明、标签…"
        resultCount={filtered.length}
        totalCount={tagFiltered.length}
      />

      {tags.length > 0 && (
        <div className="agents-page__filters">
          <Tag
            label="全部"
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {tags.map((t) => (
            <Tag
              key={t}
              label={t}
              active={activeTag === t}
              onClick={() => setActiveTag(t)}
            />
          ))}
        </div>
      )}

      {loading ? (
        <p className="page-loading">加载中…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? '暂无项目' : '未找到匹配内容'}
          description={
            items.length === 0
              ? '点击「新建项目」添加你的第一个 Agent'
              : keyword.trim()
                ? `没有包含「${keyword.trim()}」的项目，可尝试其他关键词或清除搜索`
                : `没有标签「${activeTag}」的项目`
          }
        />
      ) : (
        <div className="agents-page__grid">
          {filtered.map((p) => (
            <AgentCard key={p.id} project={p} onPreview={preview.openPreview} />
          ))}
        </div>
      )}

      <PreviewModal
        open={preview.open}
        src={preview.src}
        title={preview.title}
        onClose={preview.closePreview}
      />
    </div>
  );
}
