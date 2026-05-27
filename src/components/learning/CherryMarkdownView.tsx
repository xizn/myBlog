import { useEffect, useState } from 'react';
import { renderMarkdownWithCherryHtml } from '@/utils/cherryMarkdownHtml';
import './CherryMarkdownView.css';

interface CherryMarkdownViewProps {
  markdown: string;
  className?: string;
  onReady?: () => void;
}

/** 阅读页：Cherry 渲染 HTML（Mermaid / 画图与编辑预览一致） */
export function CherryMarkdownView({ markdown, className, onReady }: CherryMarkdownViewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);

    void renderMarkdownWithCherryHtml(markdown).then((result) => {
      if (cancelled) return;
      if (result) {
        setHtml(result);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [markdown]);

  useEffect(() => {
    if (html) onReady?.();
  }, [html, onReady]);

  if (failed) {
    return <p className="cherry-markdown-view__error">图表渲染失败，请刷新页面重试。</p>;
  }

  if (!html) {
    return <div className="cherry-markdown-view cherry-markdown-view--loading" aria-busy="true" />;
  }

  return (
    <div
      className={className ? `cherry-markdown-view ${className}` : 'cherry-markdown-view'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
