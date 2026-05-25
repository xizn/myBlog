import { useEffect, useId, useRef, useState } from 'react';
import { AiFormatButton } from '@/components/form/AiFormatButton';
import { MarkdownHint } from '@/components/form/MarkdownHint';
import { loadCherryMarkdown, type CherryInstance } from '@/utils/cherryMarkdownLoader';
import './MarkdownSplitEditor.css';
import './CherryMarkdownEditor.css';

interface MarkdownSplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  noteTitle?: string;
  disabled?: boolean;
}

/** IndexDoc / Cherry Markdown 分栏编辑（资源来自 indexdoc-editor-main） */
export function MarkdownSplitEditor({
  value,
  onChange,
  noteTitle,
  disabled,
}: MarkdownSplitEditorProps) {
  const reactId = useId().replace(/:/g, '');
  const editorId = `cherry-md-${reactId}`;
  const cherryRef = useRef<CherryInstance | null>(null);
  const syncingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let destroyed = false;
    let instance: CherryInstance | null = null;

    setLoadError(null);
    setReady(false);

    void loadCherryMarkdown()
      .then((Cherry) => {
        if (destroyed) return;
        const host = document.getElementById(editorId);
        if (!host) return;

        instance = new Cherry({
          id: editorId,
          editor: {
            defaultModel: 'edit&preview',
            height: '100%',
          },
          height: '100%',
          width: '100%',
          value,
          locale: 'zh_CN',
          callback: {
            afterChange: (text: string) => {
              if (syncingRef.current) return;
              onChangeRef.current(text);
            },
          },
        }) as CherryInstance;

        cherryRef.current = instance;
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!destroyed) {
          setLoadError(err instanceof Error ? err.message : '编辑器加载失败');
        }
      });

    return () => {
      destroyed = true;
      setReady(false);
      instance?.destroy();
      cherryRef.current = null;
    };
  }, [editorId]);

  useEffect(() => {
    const cherry = cherryRef.current;
    if (!cherry || !ready) return;
    const current = cherry.getMarkdown();
    if (current === value) return;
    syncingRef.current = true;
    cherry.setMarkdown(value, true);
    syncingRef.current = false;
  }, [value, ready]);

  useEffect(() => {
    const host = document.getElementById(editorId);
    if (!host) return;
    host.classList.toggle('md-split-editor__cherry-root--disabled', Boolean(disabled));
    const cm = host.querySelector('.CodeMirror') as { CodeMirror?: { setOption: (k: string, v: boolean) => void } } | null;
    if (cm?.CodeMirror) {
      cm.CodeMirror.setOption('readOnly', Boolean(disabled));
    }
  }, [disabled, editorId, ready]);

  const applyAiMarkdown = (markdown: string) => {
    const cherry = cherryRef.current;
    if (!cherry) return;
    syncingRef.current = true;
    cherry.setMarkdown(markdown, false);
    syncingRef.current = false;
    onChangeRef.current(markdown);
  };

  return (
    <div className="md-split-editor md-split-editor--cherry">
      <div className="md-split-editor__chrome">
        <div className="md-split-editor__head">
          <label className="md-split-editor__label" htmlFor={editorId}>
            正文（Markdown）
          </label>
          <div className="md-split-editor__head-actions">
            <AiFormatButton
              content={value}
              noteTitle={noteTitle}
              disabled={disabled || !ready}
              onFormatted={applyAiMarkdown}
            />
            <MarkdownHint />
          </div>
        </div>
      </div>

      <div className="md-split-editor__workspace">
        {loadError && (
          <p className="md-split-editor__load-error" role="alert">
            {loadError}
          </p>
        )}
        {!loadError && !ready && (
          <p className="md-split-editor__loading" aria-live="polite">
            正在加载 Markdown 编辑器…
          </p>
        )}
        <div
          id={editorId}
          className={`md-split-editor__cherry-root ${ready ? 'md-split-editor__cherry-root--ready' : ''}`}
        />
      </div>
    </div>
  );
}
