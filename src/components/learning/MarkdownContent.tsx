import { useCallback, useRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { MarkdownZoomableImage } from '@/components/learning/MarkdownZoomableImage';
import { internalLinkTo, resolveAppLink } from '@/utils/appLink';
import { scrollToMarkdownHash } from '@/utils/markdownAnchor';
import { openExternalLink } from '@/utils/openExternalLink';
import './MarkdownContent.css';

interface MarkdownContentProps {
  content: string;
}

function MarkdownAnchor({
  href,
  children,
  onClick,
  onNavigate,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  onNavigate: (to: string) => void;
}) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !href) return;

    const resolved = resolveAppLink(href);
    if (resolved?.kind === 'hash') {
      e.preventDefault();
      const root = e.currentTarget.closest('.markdown-content');
      if (root instanceof HTMLElement) {
        scrollToMarkdownHash(root, resolved.hash);
      }
      return;
    }
    if (resolved?.kind === 'internal') {
      e.preventDefault();
      onNavigate(internalLinkTo(resolved.pathname, resolved.search, resolved.hash));
      return;
    }
    if (resolved?.kind === 'external') {
      e.preventDefault();
      openExternalLink(resolved.url);
    }
  };

  const resolved = href ? resolveAppLink(href) : null;
  const external = resolved?.kind === 'external';

  return (
    <a
      href={href}
      onClick={handleClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Markdown 正文渲染（标题锚点 + 目录同页跳转） */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const navigate = useNavigate();
  const articleRef = useRef<HTMLElement>(null);
  const renderAnchor = useCallback(
    (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <MarkdownAnchor {...props} onNavigate={navigate} />
    ),
    [navigate]
  );

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
        components={{ a: renderAnchor, img: MarkdownZoomableImage }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
