import { useEffect } from 'react';
import './InteractiveBackground.css';

/** 跟随鼠标的互动背景光斑 */
export function InteractiveBackground() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="interactive-bg" aria-hidden="true">
      <div className="interactive-bg__image" />
      <div className="interactive-bg__grid" />
      <div className="interactive-bg__glow" />
      <div className="interactive-bg__orb interactive-bg__orb--1" />
      <div className="interactive-bg__orb interactive-bg__orb--2" />
      <div className="interactive-bg__orb interactive-bg__orb--3" />
    </div>
  );
}
