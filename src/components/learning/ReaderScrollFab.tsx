import { DialogPortal } from '@/components/common/DialogPortal';
import './ReaderScrollFab.css';

/** 学习笔记预览页：挂到 body，相对视口固定悬浮（不受玻璃卡片 backdrop-filter 影响） */
export function ReaderScrollFab() {
  return (
    <DialogPortal>
      <div className="reader-scroll-fab" aria-label="页面滚动">
        <button
          type="button"
          className="reader-scroll-fab__btn"
          title="回到顶部"
          aria-label="回到顶部"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
        <button
          type="button"
          className="reader-scroll-fab__btn"
          title="回到底部"
          aria-label="回到底部"
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth',
            })
          }
        >
          ↓
        </button>
      </div>
    </DialogPortal>
  );
}
