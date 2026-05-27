import {
  Children,
  isValidElement,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { MermaidDiagram } from '@/components/learning/MermaidDiagram';
import { MarkdownZoomableImage } from '@/components/learning/MarkdownZoomableImage';
import { splitMarkdownByDataImages } from '@/utils/markdownImageData';
import {
  isMermaidLanguage,
  looksLikeMermaidSource,
  normalizeMermaidSource,
} from '@/utils/mermaidDetect';

interface MarkdownBodyProps {
  content: string;
  renderAnchor: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => ReactElement;
}

/** 正文渲染：base64 大图单独输出，避免整行 Markdown 解析失败 */
export function MarkdownBody({ content, renderAnchor }: MarkdownBodyProps) {
  const segments = useMemo(() => splitMarkdownByDataImages(content), [content]);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'image') {
          return (
            <MarkdownZoomableImage
              key={`img-${index}`}
              src={segment.src}
              alt={segment.rawAlt}
            />
          );
        }
        return (
          <ReactMarkdown
            key={`md-${index}`}
            rehypePlugins={[rehypeSlug]}
            components={{
              a: renderAnchor,
              img: MarkdownZoomableImage,
              pre: ({ children, ...props }) => {
                const child = Children.only(children) as ReactNode;
                if (isValidElement(child) && child.props) {
                  const p = child.props as { className?: string; children?: ReactNode };
                  const lang = /language-([\w-]+)/.exec(p.className ?? '')?.[1];
                  const text = String(p.children ?? '').replace(/\n$/, '');
                  if (isMermaidLanguage(lang) || looksLikeMermaidSource(text)) {
                    return <MermaidDiagram code={normalizeMermaidSource(text, lang)} />;
                  }
                }
                return <pre {...props}>{children}</pre>;
              },
            }}
          >
            {segment.text}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
