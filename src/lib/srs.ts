/**
 * Leitner 盒子式间隔重复(SRS)调度——纯逻辑,不碰数据库。
 *
 * 词进生词本时在 box 1。每次复习:答对升一个盒子(间隔变长),答错回 box 1。
 * 盒子越高,下次复习间隔越久(直到稳固)。对小学生足够简单、可解释。
 */

import { dateKeyOf } from "./story-types";

const MAX_BOX = 5;
/** box 1..5 对应的复习间隔(天) */
const BOX_INTERVAL_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };

export interface Schedule {
  box: number;
  intervalDays: number;
}

export function scheduleNext(box: number, correct: boolean): Schedule {
  const nextBox = correct ? Math.min(MAX_BOX, box + 1) : 1;
  return { box: nextBox, intervalDays: BOX_INTERVAL_DAYS[nextBox] };
}

/** dueDate 当天或更早即到期(dateKey 是 YYYY-MM-DD,可直接字典序比较) */
export function isDue(dueDateKey: string, todayKey: string): boolean {
  return dueDateKey <= todayKey;
}

/** 从今天 + 间隔天数算出下次复习的 dateKey */
export function dueDateAfter(todayKey: string, intervalDays: number): string {
  const d = new Date(todayKey + "T00:00:00");
  d.setDate(d.getDate() + intervalDays);
  return dateKeyOf(d);
}
