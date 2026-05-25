import { useCallback, useEffect, useState } from 'react';
import { fetchAgents } from '@/api/agents';
import { fetchLearnings } from '@/api/learning';
import { AsyncDialogPreparing } from '@/components/common/AsyncDialogPreparing';
import { Button } from '@/components/common/Button';
import { DialogPortal } from '@/components/common/DialogPortal';
import { useAsyncDialogPhase } from '@/hooks/useAsyncDialogPhase';
import '@/styles/app-dialog.css';
import './NoteReferencePicker.css';

export type ReferenceTarget = {
  type: 'learning' | 'agent';
  id: string;
  title: string;
  summary: string;
};

type ReferenceLoadResult = {
  learnings: ReferenceTarget[];
  agents: ReferenceTarget[];
};

interface NoteReferencePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (ref: ReferenceTarget) => void;
}

async function loadReferenceTargets(): Promise<ReferenceLoadResult> {
  const [notes, projects] = await Promise.all([fetchLearnings(), fetchAgents()]);
  return {
    learnings: notes.map((n) => ({
      type: 'learning' as const,
      id: n.id,
      title: n.title,
      summary: n.summary,
    })),
    agents: projects.map((p) => ({
      type: 'agent' as const,
      id: p.id,
      title: p.title,
      summary: p.summary,
    })),
  };
}

/** 选择笔记或 Agent 项目并插入引用（数据就绪后再展示面板） */
export function NoteReferencePicker({ open, onClose, onSelect }: NoteReferencePickerProps) {
  const { phase, data } = useAsyncDialogPhase(open, loadReferenceTargets);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, onClose]);

  const filter = useCallback(
    (items: ReferenceTarget[]) => {
      const q = query.trim().toLowerCase();
      if (!q) return items;
      return items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      );
    },
    [query]
  );

  if (!open) return null;
  if (phase === 'loading') {
    return <AsyncDialogPreparing label="正在加载笔记与项目…" />;
  }

  const learnings = data?.learnings ?? [];
  const agents = data?.agents ?? [];
  const filteredLearnings = filter(learnings);
  const filteredAgents = filter(agents);

  return (
    <DialogPortal>
      <div className="app-dialog note-ref-picker" role="dialog" aria-modal="true">
        <div className="app-dialog__backdrop" onClick={onClose} />
        <div className="app-dialog__panel app-dialog__panel--wide note-ref-picker__panel">
          <h3 className="app-dialog__title">引用笔记或项目</h3>
          <p className="app-dialog__hint">选择后将插入 Markdown 引用块与链接。</p>
          <input
            className="note-ref-picker__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、摘要或 ID…"
            autoFocus
          />
          <div className="note-ref-picker__body thin-scroll">
            <section>
              <h4 className="note-ref-picker__section">学习笔记</h4>
              {filteredLearnings.length === 0 ? (
                <p className="note-ref-picker__empty">无匹配笔记</p>
              ) : (
                <ul className="note-ref-picker__list">
                  {filteredLearnings.map((item) => (
                    <li key={`l-${item.id}`}>
                      <button type="button" className="note-ref-picker__item" onClick={() => onSelect(item)}>
                        <span className="note-ref-picker__title">{item.title}</span>
                        <span className="note-ref-picker__summary">{item.summary || '暂无摘要'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h4 className="note-ref-picker__section">Agent 项目</h4>
              {filteredAgents.length === 0 ? (
                <p className="note-ref-picker__empty">无匹配项目</p>
              ) : (
                <ul className="note-ref-picker__list">
                  {filteredAgents.map((item) => (
                    <li key={`a-${item.id}`}>
                      <button type="button" className="note-ref-picker__item" onClick={() => onSelect(item)}>
                        <span className="note-ref-picker__title">{item.title}</span>
                        <span className="note-ref-picker__summary">{item.summary || '暂无摘要'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <div className="app-dialog__actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}

export function formatReferenceMarkdown(ref: ReferenceTarget): string {
  const path = ref.type === 'learning' ? `/learning/${ref.id}` : `/agents/${ref.id}`;
  const label = ref.type === 'learning' ? '笔记' : 'Agent 项目';
  return `\n> 引用${label}：[${ref.title}](${path})\n> ${ref.summary || ''}\n\n`;
}
