import { Button } from '@/components/common/Button';
import './FormEditorTabs.css';

export interface FormEditorTabItem {
  id: string;
  label: string;
  /** 草稿未保存时显示圆点 */
  isDraft?: boolean;
}

interface FormEditorTabsProps {
  tabs: FormEditorTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  newLabel?: string;
  /** 打开历史笔记与草稿选择器 */
  onOpenHistory?: () => void;
  historyLabel?: string;
}

/** 表单顶栏多窗口标签 + 右侧新建 */
export function FormEditorTabs({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
  newLabel = '+ 新建',
  onOpenHistory,
  historyLabel = '历史与草稿',
}: FormEditorTabsProps) {
  return (
    <div className="form-editor-tabs">
      <div className="form-editor-tabs__list thin-scroll" role="tablist" aria-label="编辑窗口">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <div
              key={tab.id}
              className={`form-editor-tab ${active ? 'form-editor-tab--active' : ''}`}
              role="presentation"
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="form-editor-tab__label"
                title={tab.label}
                onClick={() => onSelect(tab.id)}
              >
                <span className="form-editor-tab__text">{tab.label}</span>
                {tab.isDraft && (
                  <span
                    className="form-editor-tab__dot"
                    aria-label="草稿未保存"
                    title="草稿未保存"
                  />
                )}
              </button>
              <button
                type="button"
                className="form-editor-tab__close"
                aria-label={`关闭 ${tab.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      {onOpenHistory && (
        <Button
          type="button"
          variant="ghost"
          className="form-editor-tabs__history"
          onClick={onOpenHistory}
        >
          {historyLabel}
        </Button>
      )}
      <Button type="button" variant="outline" className="form-editor-tabs__new" onClick={onNew}>
        {newLabel}
      </Button>
    </div>
  );
}
