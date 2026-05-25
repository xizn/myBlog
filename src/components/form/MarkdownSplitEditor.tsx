import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AiFormatButton } from '@/components/form/AiFormatButton';
import { MarkdownHint } from '@/components/form/MarkdownHint';
import { ImageZoomLightbox } from '@/components/common/ImageZoomLightbox';
import { loadCherryMarkdown, type CherryInstance } from '@/utils/cherryMarkdownLoader';
import {
  charOffsetToCmPos,
  cmIndexFromPos,
  getCodeMirrorFromHost,
} from '@/utils/cherryCodeMirror';
import { syncCherryPaneHeights } from '@/utils/cherryPaneLayout';
import {
  findTextMatches,
  offsetToLineCol,
} from '@/utils/markdownEditorNav';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);

  const matches = useMemo(
    () => findTextMatches(value, searchQuery),
    [value, searchQuery]
  );

  const syncCursor = useCallback(() => {
    const cm = getCodeMirrorFromHost(editorId);
    if (cm) {
      const pos = cm.getCursor();
      const offset = cmIndexFromPos(cm, pos);
      const { line, col } = offsetToLineCol(value, offset);
      setCursorLine(line);
      setCursorCol(col);
      return;
    }
    setCursorLine(1);
    setCursorCol(1);
  }, [editorId, value]);

  const goToMatch = useCallback(
    (index: number) => {
      const cm = getCodeMirrorFromHost(editorId);
      if (!cm || matches.length === 0) return;
      const safe = ((index % matches.length) + matches.length) % matches.length;
      const m = matches[safe]!;
      const from = charOffsetToCmPos(value, m.index);
      const to = charOffsetToCmPos(value, m.index + m.length);
      cm.setSelection(from, to);
      cm.scrollIntoView(from, 80);
      setMatchIndex(safe);
      syncCursor();
    },
    [editorId, matches, value, syncCursor]
  );

  useEffect(() => {
    setMatchIndex(0);
  }, [searchQuery]);

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
    const cm = host.querySelector('.CodeMirror') as {
      CodeMirror?: { setOption: (k: string, v: boolean) => void };
    } | null;
    if (cm?.CodeMirror) {
      cm.CodeMirror.setOption('readOnly', Boolean(disabled));
    }
  }, [disabled, editorId, ready]);

  useEffect(() => {
    if (!ready) return;
    const cm = getCodeMirrorFromHost(editorId);
    if (!cm) return;
    const onActivity = () => syncCursor();
    cm.on('cursorActivity', onActivity);
    syncCursor();
    return () => {
      cm.off('cursorActivity', onActivity);
    };
  }, [ready, editorId, syncCursor]);

  useEffect(() => {
    if (!ready) return;
    const host = document.getElementById(editorId);
    if (!host) return;

    const syncLayout = () => syncCherryPaneHeights(editorId);
    syncLayout();

    const cherry = host.querySelector('.cherry');
    const ro = new ResizeObserver(syncLayout);
    if (cherry) ro.observe(cherry);
    window.addEventListener('resize', syncLayout);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncLayout);
    };
  }, [ready, editorId, value]);

  useEffect(() => {
    if (!ready) return;
    const host = document.getElementById(editorId);
    const preview = host?.querySelector('.cherry-previewer');
    if (!preview) return;

    const onPreviewClick = (e: Event) => {
      const img = (e.target as HTMLElement).closest('img');
      if (!img?.src) return;
      setZoomImage({ src: img.src, alt: img.alt || '预览图片' });
    };

    preview.addEventListener('click', onPreviewClick);
    const imgs = preview.querySelectorAll('img');
    imgs.forEach((img) => {
      img.style.cursor = 'zoom-in';
    });

    return () => preview.removeEventListener('click', onPreviewClick);
  }, [ready, editorId, value]);

  const applyAiMarkdown = (markdown: string) => {
    const cherry = cherryRef.current;
    if (!cherry) return;
    syncingRef.current = true;
    cherry.setMarkdown(markdown, false);
    syncingRef.current = false;
    onChangeRef.current(markdown);
  };

  const searchCountLabel =
    searchQuery.trim() === ''
      ? '输入关键词检索'
      : matches.length === 0
        ? '无匹配'
        : `${matchIndex + 1} / ${matches.length}`;

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

        <div className="md-split-editor__status" aria-label="编辑定位与检索">
          <span className="md-split-editor__cursor" aria-live="polite">
            行 {cursorLine} · 列 {cursorCol}
          </span>
          <div className="md-split-editor__search">
            <input
              ref={searchInputRef}
              type="search"
              className="md-split-editor__search-input"
              placeholder="检索正文…"
              aria-label="检索正文"
              value={searchQuery}
              disabled={disabled || !ready}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToMatch(e.shiftKey ? matchIndex - 1 : matchIndex + 1);
                }
              }}
            />
            <span className="md-split-editor__search-count">{searchCountLabel}</span>
            <button
              type="button"
              className="md-split-editor__search-nav"
              disabled={disabled || !ready || matches.length === 0}
              onClick={() => goToMatch(matchIndex - 1)}
              aria-label="上一处"
            >
              ↑
            </button>
            <button
              type="button"
              className="md-split-editor__search-nav"
              disabled={disabled || !ready || matches.length === 0}
              onClick={() => goToMatch(matchIndex + 1)}
              aria-label="下一处"
            >
              ↓
            </button>
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

      {zoomImage && (
        <ImageZoomLightbox
          src={zoomImage.src}
          alt={zoomImage.alt}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  );
}
