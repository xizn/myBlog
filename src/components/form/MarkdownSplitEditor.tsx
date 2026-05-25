import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiFormatButton } from '@/components/form/AiFormatButton';
import { MarkdownHint } from '@/components/form/MarkdownHint';
import {
  formatReferenceMarkdown,
  NoteReferencePicker,
  type ReferenceTarget,
} from '@/components/form/NoteReferencePicker';
import { ImageZoomLightbox } from '@/components/common/ImageZoomLightbox';
import { loadCherryMarkdown, type CherryInstance } from '@/utils/cherryMarkdownLoader';
import {
  charOffsetToCmPos,
  cmIndexFromPos,
  getCodeMirrorFromHost,
} from '@/utils/cherryCodeMirror';
import { bindCherryEditorPreviewScroll } from '@/utils/cherryEditorPreviewSync';
import { getCherryThemeSettings, syncCherryTheme } from '@/utils/cherryEditorTheme';
import { syncCherryPaneHeights } from '@/utils/cherryPaneLayout';
import { mountCherryNoteLinkButton } from '@/utils/cherryNoteLinkButton';
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
  const navigate = useNavigate();
  const reactId = useId().replace(/:/g, '');
  const editorId = `cherry-md-${reactId}`;
  const cherryRef = useRef<CherryInstance | null>(null);
  const syncingRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
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
  const [refPickerOpen, setRefPickerOpen] = useState(false);

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
          autoScrollByCursor: true,
          editor: {
            defaultModel: 'edit&preview',
            height: '100%',
          },
          height: '100%',
          width: '100%',
          value,
          locale: 'zh_CN',
          themeSettings: getCherryThemeSettings(),
          callback: {
            afterChange: (text: string) => {
              if (syncingRef.current) return;
              onChangeRef.current(text);
              requestAnimationFrame(() => syncCherryPaneHeights(editorId, instance));
            },
          },
        }) as CherryInstance;

        cherryRef.current = instance;
        setReady(true);
        requestAnimationFrame(() => syncCherryPaneHeights(editorId, instance));
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
    if (!ready) return;
    const cherry = cherryRef.current;
    syncCherryTheme(cherry);

    const observer = new MutationObserver(() => {
      syncCherryTheme(cherryRef.current);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });

    return () => observer.disconnect();
  }, [ready]);

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

    const syncLayout = () => {
      syncCherryPaneHeights(editorId, cherryRef.current);
    };
    syncLayout();

    const cherry = host.querySelector('.cherry');
    const ro = new ResizeObserver(syncLayout);
    if (cherry) ro.observe(cherry);
    window.addEventListener('resize', syncLayout);

  let unbindScroll = () => {};
  const bindScroll = () => {
    unbindScroll();
    unbindScroll = bindCherryEditorPreviewScroll(editorId, cherryRef.current);
  };
  bindScroll();
  const bindTimer = window.setTimeout(bindScroll, 120);

    return () => {
      window.clearTimeout(bindTimer);
      ro.disconnect();
      window.removeEventListener('resize', syncLayout);
      unbindScroll();
    };
  }, [ready, editorId]);

  useEffect(() => {
    if (!ready) return;
    const host = document.getElementById(editorId);
    const preview = host?.querySelector('.cherry-previewer');
    if (!preview) return;

    const onPreviewClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor?.href) {
        try {
          const url = new URL(anchor.href, window.location.origin);
          const internal =
            url.origin === window.location.origin &&
            (/^\/learning\/[^/]+$/.test(url.pathname) || /^\/agents\/[^/]+$/.test(url.pathname));
          if (internal) {
            e.preventDefault();
            navigate(url.pathname);
            return;
          }
        } catch {
          /* ignore malformed href */
        }
      }

      const img = target.closest('img');
      if (!img?.src) return;
      setZoomImage({ src: img.src, alt: img.alt || '预览图片' });
    };

    preview.addEventListener('click', onPreviewClick);
    const imgs = preview.querySelectorAll('img');
    imgs.forEach((img) => {
      img.style.cursor = 'zoom-in';
    });

    return () => preview.removeEventListener('click', onPreviewClick);
  }, [ready, editorId, value, navigate]);

  const applyAiMarkdown = (markdown: string) => {
    const cherry = cherryRef.current;
    if (!cherry) return;
    syncingRef.current = true;
    cherry.setMarkdown(markdown, false);
    syncingRef.current = false;
    onChangeRef.current(markdown);
  };

  const handleReferenceSelect = useCallback(
    (ref: ReferenceTarget) => {
      setRefPickerOpen(false);
      const snippet = formatReferenceMarkdown(ref);
      const cm = getCodeMirrorFromHost(editorId);
      if (cm) {
        cm.replaceSelection(snippet);
        cm.focus();
        onChangeRef.current(cm.getValue());
        return;
      }
      onChangeRef.current(`${value}${snippet}`);
    },
    [editorId, value]
  );

  useEffect(() => {
    if (!ready) return;
    return mountCherryNoteLinkButton(editorId, () => {
      if (disabledRef.current) return;
      setRefPickerOpen(true);
    });
  }, [ready, editorId]);

  useEffect(() => {
    if (!ready) return;
    const host = document.getElementById(editorId);
    const btn = host?.querySelector('.cherry-toolbar-noteLink');
    btn?.classList.toggle('disabled', Boolean(disabled));
  }, [disabled, ready, editorId]);

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

      <NoteReferencePicker
        open={refPickerOpen}
        onClose={() => setRefPickerOpen(false)}
        onSelect={handleReferenceSelect}
      />
    </div>
  );
}
