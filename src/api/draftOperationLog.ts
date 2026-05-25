import type { FormOperation } from '@/types/formLog';

export const DRAFT_OP_LEAVE = '未保存离开';
export const DRAFT_OP_FIRST_SAVE = '第一次保存';
export const DRAFT_OP_SAVED = '已保存';

export function createDraftOperation(action: string, detail?: string): FormOperation {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: new Date().toISOString(),
    action,
    detail,
  };
}

/** 在记录顶部追加一条操作（最多保留 50 条） */
export function prependDraftOperation(
  operations: FormOperation[],
  action: string,
  detail?: string
): FormOperation[] {
  return [createDraftOperation(action, detail), ...operations].slice(0, 50);
}

/** 保存笔记/项目后的记录文案 */
export function draftSaveActionLabel(isFirstSave: boolean): string {
  return isFirstSave ? DRAFT_OP_FIRST_SAVE : DRAFT_OP_SAVED;
}
