import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AgentProject } from '@/types';
import { parseTags, tagsToString } from '@/utils/parseTags';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import './Form.css';

const STATUS_OPTIONS = [
  { value: 'active', label: '\u8fdb\u884c\u4e2d' },
  { value: 'wip', label: '\u5f00\u53d1\u4e2d' },
  { value: 'archived', label: '\u5df2\u5f52\u6863' },
] as const;

const PREVIEW_TYPE_OPTIONS = [
  { value: 'none', label: '\u65e0\u9884\u89c8' },
  { value: 'local', label: '\u672c\u5730\u9759\u6001\u9875' },
  { value: 'iframe', label: '\u5916\u94fe iframe' },
] as const;

export interface AgentFormValues {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string;
  status: AgentProject['status'];
  repoUrl: string;
  previewUrl: string;
  previewType: AgentProject['previewType'];
  featured: boolean;
}

interface AgentFormProps {
  initial?: AgentFormValues;
  restoredValues?: AgentFormValues | null;
  restoreKey?: number;
  onValuesChange?: (values: AgentFormValues) => void;
  onSubmit: (values: AgentFormValues) => Promise<void>;
  onCancel: () => void;
}

export function toAgentFormValues(item?: AgentProject): AgentFormValues {
  return {
    id: item?.id ?? '',
    title: item?.title ?? '',
    summary: item?.summary ?? '',
    description: item?.description ?? '',
    tags: item ? tagsToString(item.tags) : '',
    status: item?.status ?? 'active',
    repoUrl: item?.repoUrl ?? '',
    previewUrl: item?.previewUrl ?? '',
    previewType: item?.previewType ?? 'none',
    featured: item?.featured ?? false,
  };
}

export function AgentForm({
  initial,
  restoredValues,
  restoreKey = 0,
  onValuesChange,
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const [values, setValues] = useState<AgentFormValues>(() =>
    initial ? { ...initial } : toAgentFormValues()
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;
  const skipValuesNotifyRef = useRef(true);

  useEffect(() => {
    if (restoredValues) {
      setValues({ ...restoredValues });
      skipValuesNotifyRef.current = true;
    }
  }, [restoredValues, restoreKey]);

  useEffect(() => {
    if (skipValuesNotifyRef.current) {
      skipValuesNotifyRef.current = false;
      return;
    }
    onValuesChangeRef.current?.(values);
  }, [values]);

  const set = <K extends keyof AgentFormValues>(key: K, val: AgentFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      setError('\u8bf7\u586b\u5199\u9879\u76ee\u540d\u79f0');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4fdd\u5b58\u5931\u8d25');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-body" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}

      <div className="form-body__grid">
        <div className="form-field form-field--full">
          <label htmlFor="title">{'\u9879\u76ee\u540d\u79f0 *'}</label>
          <input
            id="title"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={'\u4f8b\uff1aCursor Automation'}
          />
        </div>

        <div className="form-field">
          <label htmlFor="id">{'\u81ea\u5b9a\u4e49 ID\uff08\u53ef\u9009\uff09'}</label>
          <input
            id="id"
            value={values.id}
            onChange={(e) => set('id', e.target.value)}
            placeholder={'\u7559\u7a7a\u5219\u81ea\u52a8\u751f\u6210'}
            disabled={Boolean(initial?.id)}
          />
          <p className="form-hint">{'\u7528\u4e8e URL\uff1a/agents/\u4f60\u7684-id'}</p>
        </div>

        <div className="form-field">
          <label htmlFor="status">{'\u72b6\u6001'}</label>
          <Select
            id="status"
            value={values.status}
            options={[...STATUS_OPTIONS]}
            onChange={(v) => set('status', v as AgentProject['status'])}
          />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="summary">{'\u4e00\u53e5\u8bdd\u7b80\u4ecb *'}</label>
          <input
            id="summary"
            value={values.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="description">{'\u8be6\u7ec6\u8bf4\u660e *'}</label>
          <textarea
            id="description"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="tags">{'\u6807\u7b7e'}</label>
          <input
            id="tags"
            value={values.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder={'Cursor, Agent\uff08\u9017\u53f7\u5206\u9694\uff09'}
          />
        </div>

        <div className="form-field">
          <label htmlFor="previewType">{'\u9884\u89c8\u7c7b\u578b'}</label>
          <Select
            id="previewType"
            value={values.previewType}
            options={[...PREVIEW_TYPE_OPTIONS]}
            onChange={(v) => set('previewType', v as AgentProject['previewType'])}
          />
        </div>

        <div className="form-field">
          <label htmlFor="previewUrl">{'\u9884\u89c8\u5730\u5740'}</label>
          <input
            id="previewUrl"
            value={values.previewUrl}
            onChange={(e) => set('previewUrl', e.target.value)}
            placeholder="/previews/demo/index.html"
          />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="repoUrl">{'\u4ed3\u5e93\u94fe\u63a5'}</label>
          <input
            id="repoUrl"
            value={values.repoUrl}
            onChange={(e) => set('repoUrl', e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <div className="form-actions form-actions--bar">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? '\u4fdd\u5b58\u4e2d\u2026' : '\u4fdd\u5b58\u9879\u76ee'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          {'\u53d6\u6d88'}
        </Button>
      </div>
    </form>
  );
}

export function agentFormToInput(values: AgentFormValues) {
  return {
    id: values.id.trim() || undefined,
    title: values.title.trim(),
    summary: values.summary.trim(),
    description: values.description.trim(),
    tags: parseTags(values.tags),
    status: values.status,
    repoUrl: values.repoUrl.trim() || undefined,
    previewUrl: values.previewUrl.trim() || undefined,
    previewType: values.previewType,
    featured: values.featured,
  };
}
