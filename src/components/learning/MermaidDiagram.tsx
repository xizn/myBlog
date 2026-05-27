import { useEffect, useState } from 'react';
import { renderMermaidForReadPage } from '@/utils/cherryMermaidRenderer';
import { normalizeMermaidSource } from '@/utils/mermaidDetect';

interface MermaidDiagramProps {
  code: string;
}

/** 阅读页 Mermaid 图（复用 Cherry 内置 mermaid.js） */
export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);

    void renderMermaidForReadPage(normalizeMermaidSource(code)).then((svg) => {
      if (cancelled) return;
      if (svg) {
        setHtml(svg);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (failed) {
    return (
      <pre className="markdown-mermaid-fallback">
        <code>{code}</code>
      </pre>
    );
  }

  if (!html) {
    return <div className="markdown-mermaid markdown-mermaid--loading" aria-busy="true" />;
  }

  return (
    <figure
      className="markdown-mermaid"
      data-type="mermaid"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
