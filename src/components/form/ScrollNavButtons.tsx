import './ScrollNavButtons.css';

interface ScrollNavButtonsProps {
  /** 可滚动容器；默认 window */
  containerRef?: React.RefObject<HTMLElement | null>;
}

/** 右下角：回到顶部 / 回到底部 */
export function ScrollNavButtons({ containerRef }: ScrollNavButtonsProps) {
  const scrollToTop = () => {
    const el = containerRef?.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    const el = containerRef?.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="scroll-nav-buttons" aria-label="页面滚动">
      <button type="button" className="scroll-nav-buttons__btn" onClick={scrollToTop} title="回到顶部">
        ↑
      </button>
      <button type="button" className="scroll-nav-buttons__btn" onClick={scrollToBottom} title="回到底部">
        ↓
      </button>
    </div>
  );
}
