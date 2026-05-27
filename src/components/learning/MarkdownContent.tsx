import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CherryMarkdownView } from '@/components/learning/CherryMarkdownView';
import { MarkdownBody } from '@/components/learning/MarkdownBody';
import { buildInternalNavState } from '@/utils/editorReturnTo';
import { internalLinkTo, resolveAppLink } from '@/utils/appLink';
import { scrollToMarkdownHash } from '@/utils/markdownAnchor';
import {
  applySearchHighlights,
  clearSearchHighlights,
  scrollToSearchMatch,
  type TextSearchMatch,
} from '@/utils/markdownSearchHighlight';
import { markdownContainsMermaid } from '@/utils/mermaidDetect';
import { openExternalLink } from '@/utils/openExternalLink';
import './MarkdownContent.css';

export interface MarkdownContentSearchState {
  searchQuery: string;
  searchCaseSensitive: boolean;
  matchIndex: number;
  matches: TextSearchMatch[];
}

interface MarkdownContentProps {
  content: string;
  search?: MarkdownContentSearchState;
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

/** Markdown 正文渲染（标题锚点 + Mermaid；检索由详情页工具栏驱动） */
export function MarkdownContent({ content, search }: MarkdownContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const articleRef = useRef<HTMLElement>(null);
  const useCherryRender = useMemo(() => markdownContainsMermaid(content), [content]);
  const [cherryReady, setCherryReady] = useState(!useCherryRender);

  const navigateInternal = useCallback(
    (to: string) => {
      const fallback = location.pathname.startsWith('/agents') ? '/agents' : '/learning';
      navigate(to, { state: buildInternalNavState(location, fallback) });
    },
    [location, navigate]
  );

  const renderAnchor = useCallback(
    (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <MarkdownAnchor {...props} onNavigate={navigateInternal} />
    ),
    [navigateInternal]
  );

  const handleArticleClick = useCallback((e: MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!anchor || !href?.startsWith('#')) return;

    e.preventDefault();
    const root = articleRef.current;
    if (root) scrollToMarkdownHash(root, href);
  }, []);

  useEffect(() => {
    if (!useCherryRender) setCherryReady(true);
    else setCherryReady(false);
  }, [content, useCherryRender]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root || !cherryReady || !search) return;

    const { searchQuery, matches, matchIndex } = search;
    if (!searchQuery.trim() || matches.length === 0) {
      clearSearchHighlights(root);
      return;
    }

    applySearchHighlights(root, matches, matchIndex);
    scrollToSearchMatch(root, matches, matchIndex);
    return () => clearSearchHighlights(root);
  }, [search, cherryReady]);

  return (
    <article
      ref={articleRef}
      className="markdown-content"
      onClick={handleArticleClick}
    >
      {useCherryRender ? (
        <CherryMarkdownView
          markdown={content}
          className="cherry-markdown-read"
          onReady={() => setCherryReady(true)}
        />
      ) : (
        <MarkdownBody content={content} renderAnchor={renderAnchor} />
      )}
    </article>
  );
}
