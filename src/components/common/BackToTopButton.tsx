import { useEffect, useState } from 'react';
import './BackToTopButton.css';

const SHOW_AFTER_PX = 360;

/** 详情页阅览时回到顶部 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="回到顶部"
      title="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <span className="back-to-top__icon" aria-hidden>
        ↑
      </span>
    </button>
  );
}
