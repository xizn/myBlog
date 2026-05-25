import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MARKDOWN_HINTS } from '@/constants/markdownHints';
import './MarkdownHint.css';

/** 标签旁 Markdown 语法悬停提示（Portal 避免被遮挡） */
export function MarkdownHint() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 300;
    let left = rect.right + 8;
    if (left + panelWidth > window.innerWidth - 16) {
      left = Math.max(16, rect.left - panelWidth - 8);
    }
    setPos({ top: rect.bottom + 8, left });
  }, [open]);

  return (
    <span
      className="markdown-hint"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="markdown-hint__trigger"
        aria-label="查看 Markdown 基础语法"
        tabIndex={0}
      >
        ?
      </button>
      {open &&
        createPortal(
          <div
            className="markdown-hint__panel markdown-hint__panel--portal"
            role="tooltip"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="markdown-hint__title">Markdown 速查</p>
            <ul className="markdown-hint__list">
              {MARKDOWN_HINTS.map(({ syntax, desc }) => (
                <li key={syntax} className="markdown-hint__item">
                  <code className="markdown-hint__syntax">{syntax}</code>
                  <span className="markdown-hint__desc">{desc}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </span>
  );
}
