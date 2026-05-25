/** 学习记录条目 */
export interface LearningRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** 设为 true 时显示在首页「最近学习」 */
  toBeContinued: boolean;
  /** 上次打开详情页阅读的时间（ISO） */
  lastReadAt?: string;
}
