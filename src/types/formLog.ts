/** 表单操作记录 */
export interface FormOperation {
  id: string;
  time: string;
  action: string;
  detail?: string;
}

/** 草稿存储结构 */
export interface FormDraft<T> {
  data: T;
  savedAt: string;
}
