import { useMemo, type AnchorHTMLAttributes, type ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { MarkdownZoomableImage } from '@/components/learning/MarkdownZoomableImage';
import { splitMarkdownByDataImages } from '@/utils/markdownImageData';

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
            components={{ a: renderAnchor, img: MarkdownZoomableImage }}
          >
            {segment.text}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
