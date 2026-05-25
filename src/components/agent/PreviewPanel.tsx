import './PreviewPanel.css';

interface PreviewPanelProps {
  src: string;
  title: string;
  embedded?: boolean;
}

/** 内嵌 iframe 预览面板 */
export function PreviewPanel({ src, title, embedded = false }: PreviewPanelProps) {
  return (
    <div className={`preview-panel ${embedded ? 'preview-panel--embedded' : ''}`}>
      <div className="preview-panel__bar">
        <span className="preview-panel__dot" />
        <span className="preview-panel__dot" />
        <span className="preview-panel__dot" />
        <span className="preview-panel__url">{src}</span>
      </div>
      <iframe
        title={`${title} 预览`}
        src={src}
        className="preview-panel__frame"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="lazy"
      />
    </div>
  );
}
