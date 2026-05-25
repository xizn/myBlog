import { useCallback, useState } from 'react';

/** 管理预览弹层开关 */
export function usePreview() {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  /** 打开预览 */
  const openPreview = useCallback((url: string, previewTitle: string) => {
    setSrc(url);
    setTitle(previewTitle);
    setOpen(true);
  }, []);

  /** 关闭预览 */
  const closePreview = useCallback(() => {
    setOpen(false);
    setSrc(null);
    setTitle('');
  }, []);

  return { open, src, title, openPreview, closePreview };
}
