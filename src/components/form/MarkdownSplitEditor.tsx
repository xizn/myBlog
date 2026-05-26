import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { getCherryThemeSettings, isAppDarkTheme, syncCherryTheme } from '@/utils/cherryEditorTheme';
import { getCherryMermaidRendererConfig } from '@/utils/cherryMermaidRenderer';
import { syncCherryPaneHeights } from '@/utils/cherryPaneLayout';
import {
  ensureCherryPreviewerClosed,
  setCherryPreviewerOpen,
} from '@/utils/cherryPreviewPane';
import { mountCherryNoteLinkButton } from '@/utils/cherryNoteLinkButton';
import {
  patchCherryDataImageResize,
  sanitizeCherryDataImageMarkdown,
} from '@/utils/cherryDataImageMarkdown';
import { internalLinkTo, resolveAppLink } from '@/utils/appLink';
import { buildInternalNavState } from '@/utils/editorReturnTo';
import {
  findTextMatches,
  offsetToLineCol,
} from '@/utils/markdownEditorNav';
import { openExternalLink } from '@/utils/openExternalLink';
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
  const location = useLocation();
  const reactId = useId().replace(/:/g, '');
  const editorId = `cherry-md-${reactId}`;
  const cherryRef = useRef<CherryInstance | null>(null);
  const previewOpenRef = useRef(false);
  const syncingRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);

  const matches = useMemo(
    () => findTextMatches(value, searchQuery, { caseSensitive: searchCaseSensitive }),
    [value, searchQuery, searchCaseSensitive]
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
  }, [searchQuery, searchCaseSensitive]);

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
          previewer: {
            lazyLoadImg: {
              noLoadImgNum: -1,
            },
          },
          height: '100%',
          width: '100%',
          value,
          locale: 'zh_CN',
          themeSettings: getCherryThemeSettings(),
          ...getCherryMermaidRendererConfig(isAppDarkTheme()) ?? {},
          callback: {
            beforeImageMounted: (srcProp: string, src: string) => {
              if (typeof src === 'string' && src.startsWith('data:image/')) {
                return { srcProp, src };
              }
              return { srcProp, src };
            },
            afterChange: (text: string) => {
              if (syncingRef.current) return;
              const cleaned = sanitizeCherryDataImageMarkdown(text);
              if (cleaned !== text) {
                syncingRef.current = true;
                instance?.setMarkdown(cleaned, true);
                syncingRef.current = false;
                onChangeRef.current(cleaned);
              } else {
                onChangeRef.current(text);
              }
              requestAnimationFrame(() => {
                if (!previewOpenRef.current) {
                  ensureCherryPreviewerClosed(editorId, instance);
                } else {
                  syncCherryPaneHeights(editorId, instance, true);
                }
              });
            },
          },
        }) as CherryInstance;

        cherryRef.current = instance;
        patchCherryDataImageResize(instance);
        previewOpenRef.current = true;
        instance.switchModel?.('edit&preview');
        setReady(true);
        requestAnimationFrame(() => setCherryPreviewerOpen(editorId, instance, true));
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
      attributeFilter: ['data-theme-mode', 'data-theme-bg-image', 'data-theme-bg-tone'],
    });

    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    const cherry = cherryRef.current;
    if (!cherry || !ready) return;
    const current = cherry.getMarkdown();
    if (current === value) return;
    const incoming = sanitizeCherryDataImageMarkdown(value);
    syncingRef.current = true;
    cherry.setMarkdown(incoming, true);
    syncingRef.current = false;
    requestAnimationFrame(() => {
      if (!previewOpenRef.current) {
        ensureCherryPreviewerClosed(editorId, cherry);
      }
    });
  }, [value, ready, editorId]);

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
      syncCherryPaneHeights(editorId, cherryRef.current, previewOpenRef.current);
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
      if (!anchor?.href) return;
      const resolved = resolveAppLink(anchor.href);
      if (resolved?.kind === 'internal') {
        e.preventDefault();
        const fallback = location.pathname.startsWith('/agents') ? '/agents' : '/learning';
        navigate(internalLinkTo(resolved.pathname, resolved.search, resolved.hash), {
          state: buildInternalNavState(location, fallback),
        });
        return;
      }
      if (resolved?.kind === 'external') {
        e.preventDefault();
        openExternalLink(resolved.url);
      }
    };

    const onPreviewDblClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const img = target.closest('img');
      if (!img?.src) return;
      e.preventDefault();
      e.stopPropagation();
      setZoomImage({ src: img.src, alt: img.alt || '预览图片' });
    };

    preview.addEventListener('click', onPreviewClick, true);
    preview.addEventListener('dblclick', onPreviewDblClick, true);
    const imgs = preview.querySelectorAll('img');
    imgs.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.title = img.title || '单击调整大小，双击放大查看';
    });

    return () => {
      preview.removeEventListener('click', onPreviewClick, true);
      preview.removeEventListener('dblclick', onPreviewDblClick, true);
    };
  }, [ready, editorId, value, navigate, location]);

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
    const cherry = cherryRef.current;
    if (!ready || !cherry?.$event) return;

    const onOpen = () => {
      previewOpenRef.current = true;
      requestAnimationFrame(() => {
        syncCherryPaneHeights(editorId, cherry, true);
        try {
          const html = cherry.getHtml?.();
          if (html && cherry.previewer?.refresh) {
            cherry.previewer.refresh(html);
          }
        } catch {
          /* 预览刷新失败时不阻断编辑 */
        }
      });
    };
    const onClose = () => {
      previewOpenRef.current = false;
      requestAnimationFrame(() => setCherryPreviewerOpen(editorId, cherry, false));
    };

    cherry.$event.on('previewerOpen', onOpen);
    cherry.$event.on('previewerClose', onClose);

    return () => {
      cherry.$event?.off('previewerOpen', onOpen);
      cherry.$event?.off('previewerClose', onClose);
    };
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
            <button
              type="button"
              className={`md-split-editor__search-case${searchCaseSensitive ? ' md-split-editor__search-case--on' : ''}`}
              disabled={disabled || !ready}
              aria-label="区分大小写"
              aria-pressed={searchCaseSensitive}
              title={searchCaseSensitive ? '区分大小写（已开启）' : '区分大小写（已关闭）'}
              onClick={() => setSearchCaseSensitive((on) => !on)}
            >
              Aa
            </button>
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
