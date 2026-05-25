import { Link } from 'react-router-dom';
import { SITE } from '@/constants/site';
import { useFeaturedAgents } from '@/hooks/useAgents';
import { useRecentLearnings } from '@/hooks/useLearnings';
import { usePreview } from '@/hooks/usePreview';
import { AgentCard } from '@/components/agent/AgentCard';
import { LearningCard } from '@/components/learning/LearningCard';
import { PreviewModal } from '@/components/agent/PreviewModal';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import './HomePage.css';

/** 首页 */
export function HomePage() {
  const { items: agents, loading: agentsLoading } = useFeaturedAgents();
  const { items: learnings, loading: learningsLoading } = useRecentLearnings();
  const preview = usePreview();

  return (
    <div className="home">
      <section className="home-hero">
        <p className="home-hero__eyebrow">Personal Studio</p>
        <h1 className="home-hero__title">{SITE.name}</h1>
        <p className="home-hero__desc">{SITE.description}</p>
        <div className="home-hero__actions">
          <Link to="/agents">
            <Button variant="primary">浏览 Agent 项目</Button>
          </Link>
          <Link to="/learning">
            <Button variant="outline">阅读学习记录</Button>
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <h2 className="home-section__title">精选 Agent</h2>
          <Link to="/agents" className="home-section__more">
            查看全部 →
          </Link>
        </div>
        {agentsLoading ? (
          <p className="home-loading">加载中…</p>
        ) : agents.length === 0 ? (
          <EmptyState
            title="暂无精选项目"
            description="在 Agent 项目编辑页开启「精选」后，会显示在此处"
          />
        ) : (
          <div className="home-grid">
            {agents.map((p) => (
              <AgentCard key={p.id} project={p} onPreview={preview.openPreview} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <h2 className="home-section__title">最近学习</h2>
          <Link to="/learning" className="home-section__more">
            查看全部 →
          </Link>
        </div>
        {learningsLoading ? (
          <p className="home-loading">加载中…</p>
        ) : learnings.length === 0 ? (
          <EmptyState
            title="暂无未完待续笔记"
            description="在学习笔记编辑页开启「未完待续」后，会显示在此处"
          />
        ) : (
          <div className="home-learning-list">
            {learnings.map((r) => (
              <LearningCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </section>

      <PreviewModal
        open={preview.open}
        src={preview.src}
        title={preview.title}
        onClose={preview.closePreview}
      />
    </div>
  );
}
