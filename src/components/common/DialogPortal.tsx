import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** 将弹层挂到 body，避免被顶栏 sticky/overflow 裁切 */
export function DialogPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
