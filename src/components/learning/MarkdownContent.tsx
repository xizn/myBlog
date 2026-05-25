import { useCallback, useRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { scrollToMarkdownHash } from '@/utils/markdownAnchor';
import './MarkdownContent.css';

interface MarkdownContentProps {
  content: string;
}

function MarkdownAnchor({
  href,
  children,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isHash = href?.startsWith('#');

  if (isHash && href) {
    return (
      <a
        href={href}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          const root = (e.currentTarget as HTMLElement).closest('.markdown-content');
          if (root instanceof HTMLElement) {
            scrollToMarkdownHash(root, href);
          }
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

/** Markdown 正文渲染（标题锚点 + 目录同页跳转） */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const articleRef = useRef<HTMLElement>(null);

  const handleArticleClick = useCallback((e: MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!anchor || !href?.startsWith('#')) return;

    e.preventDefault();
    const root = articleRef.current;
    if (root) scrollToMarkdownHash(root, href);
  }, []);

  return (
    <article
      ref={articleRef}
      className="markdown-content"
      onClick={handleArticleClick}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeSlug]}
        components={{ a: MarkdownAnchor }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
