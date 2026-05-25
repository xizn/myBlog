import './FormFlagToggle.css';

interface FormFlagToggleProps {
  label: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** 悬停提示 */
  title?: string;
  /** toolbar：详情页顶栏，与「编辑」同排 */
  variant?: 'inline' | 'toolbar';
  disabled?: boolean;
}

/** 表单开关（精选、未完待续等） */
export function FormFlagToggle({
  label,
  pressed,
  onPressedChange,
  title,
  variant = 'inline',
  disabled = false,
}: FormFlagToggleProps) {
  const isToolbar = variant === 'toolbar';

  return (
    <label
      className={`form-switch ${pressed ? 'form-switch--on' : ''} ${isToolbar ? 'form-switch--toolbar' : ''}`}
      title={title}
    >
      <input
        type="checkbox"
        className="form-switch__input"
        checked={pressed}
        disabled={disabled}
        onChange={(e) => onPressedChange(e.target.checked)}
      />
      <span className="form-switch__label">{label}</span>
      <span className="form-switch__track" aria-hidden="true">
        <span className="form-switch__thumb" />
      </span>
    </label>
  );
}
