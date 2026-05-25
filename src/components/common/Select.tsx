import { useEffect, useId, useRef, useState } from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** 自定义下拉选择（与表单输入框风格统一） */
export function Select({
  id: idProp,
  value,
  options,
  onChange,
  placeholder = '请选择',
  disabled,
}: SelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /** 选中选项 */
  const pick = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`ui-select ${open ? 'ui-select--open' : ''} ${disabled ? 'ui-select--disabled' : ''}`}
    >
      <button
        type="button"
        id={id}
        className="ui-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? '' : 'ui-select__placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <span className="ui-select__arrow" aria-hidden />
      </button>
      {open && (
        <ul className="ui-select__menu" role="listbox" aria-labelledby={id}>
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`ui-select__option ${opt.value === value ? 'ui-select__option--active' : ''}`}
                onClick={() => pick(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
