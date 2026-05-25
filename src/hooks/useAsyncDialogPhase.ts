import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncDialogPhase = 'closed' | 'loading' | 'ready';

/** 打开弹窗前异步拉数，ready 后再展示内容，避免窗口尺寸跳动 */
export function useAsyncDialogPhase<T>(
  requested: boolean,
  load: () => Promise<T>,
  onReset?: () => void
) {
  const [phase, setPhase] = useState<AsyncDialogPhase>('closed');
  const [data, setData] = useState<T | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!requested) {
      setPhase('closed');
      setData(null);
      onReset?.();
      return;
    }

    let cancelled = false;
    setPhase('loading');
    setData(null);

    void loadRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setPhase('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setPhase('ready');
      });

    return () => {
      cancelled = true;
    };
  }, [requested, onReset]);

  const close = useCallback(() => {
    setPhase('closed');
    setData(null);
  }, []);

  return { phase, data, close, isActive: requested && phase !== 'closed' };
}
