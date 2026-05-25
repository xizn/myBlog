import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { LearningRecord } from '@/types';
import { MarkdownSplitEditor } from '@/components/form/MarkdownSplitEditor';
import { parseTags, tagsToString } from '@/utils/parseTags';
import { Button } from '@/components/common/Button';
import './Form.css';
import './FormFlagToggle.css';

export interface LearningFormValues {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  toBeContinued: boolean;
}

interface LearningFormProps {
  initial?: LearningFormValues;
  restoredValues?: LearningFormValues | null;
  restoreKey?: number;
  onValuesChange?: (values: LearningFormValues) => void;
  onSubmit: (values: LearningFormValues) => Promise<void>;
  onCancel: () => void;
}

/** 从记录生成表单初始值 */
export function toLearningFormValues(item?: LearningRecord): LearningFormValues {
  return {
    id: item?.id ?? '',
    title: item?.title ?? '',
    summary: item?.summary ?? '',
    content: item?.content ?? '',
    tags: item ? tagsToString(item.tags) : '',
    toBeContinued: item?.toBeContinued ?? false,
  };
}

/** 学习记录表单 */
export function LearningForm({
  initial,
  restoredValues,
  restoreKey = 0,
  onValuesChange,
  onSubmit,
  onCancel,
}: LearningFormProps) {
  const [values, setValues] = useState<LearningFormValues>(() =>
    initial ? { ...initial } : toLearningFormValues()
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

  const set = <K extends keyof LearningFormValues>(key: K, val: LearningFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      setError('请填写标题');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-body" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}

      <div className="form-body__grid">
        <div className="form-field form-field--full">
          <label htmlFor="title">标题 *</label>
          <input id="title" value={values.title} onChange={(e) => set('title', e.target.value)} />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="id">自定义 ID（可选）</label>
          <input
            id="id"
            value={values.id}
            onChange={(e) => set('id', e.target.value)}
            placeholder="留空则自动生成"
            disabled={Boolean(initial)}
          />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="summary">摘要 *</label>
          <input id="summary" value={values.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="tags">标签</label>
          <input
            id="tags"
            value={values.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="React, Cursor"
          />
        </div>

        <div className="form-field form-field--full form-field--editor">
          <MarkdownSplitEditor
            value={values.content}
            onChange={(content) => set('content', content)}
            noteTitle={values.title}
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-actions form-actions--bar">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? '保存中…' : '保存笔记'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          取消
        </Button>
      </div>
    </form>
  );
}

/** 将表单值转为 API 入参 */
export function learningFormToInput(values: LearningFormValues) {
  return {
    id: values.id.trim() || undefined,
    title: values.title.trim(),
    summary: values.summary.trim(),
    content: values.content.trim(),
    tags: parseTags(values.tags),
    toBeContinued: values.toBeContinued,
  };
}
