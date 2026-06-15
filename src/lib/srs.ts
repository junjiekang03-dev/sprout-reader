/**
 * Anki 式 SM-2 间隔重复(SRS)调度——纯逻辑,不碰数据库。
 *
 * 取代早先的 Leitner 盒子:每个词带一个独立的「难度系数 ease(EF)」+ 动态间隔。
 * 答对时下次间隔 = 当前间隔 × ease(越答越久);答错则重置(明天再练)且永久调低 ease,
 * 于是「老是记不住的词」会被排得越来越温和,而「一记就牢的词」间隔成倍拉长——
 * 这是 SM-2 相对固定盒子的核心改进。
 *
 * 复习界面保留「看词选释义」选择题(对 8-12 岁更友好、比自评可靠),
 * 二元对错映射成 SM-2 质量分:对→4(good)、错→2(again/lapse)。
 * 识别题不给满分 5(有选项,比主动回忆容易),所以答对时 ease 维持不变、不虚高。
 * 引擎内部按 0-5 质量分计算,留好将来接更细评分的口子。
 */

import { dateKeyOf } from "./story-types";

export const INIT_EASE = 2.5;
export const MIN_EASE = 1.3;
/** 间隔 ≥ 21 天视为「成熟卡 / 牢记」(同 Anki mature 口径);驱动 wordsMastered */
export const MATURE_INTERVAL_DAYS = 21;

/** 选择题二元结果 */
export type Grade = "good" | "again";

export interface CardState {
  ease: number;
  reps: number;
  intervalDays: number;
}

/** 选择题二元 → SM-2 质量分 q(0-5,≥3 为答对) */
function gradeToQuality(grade: Grade): number {
  return grade === "good" ? 4 : 2;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 一次复习后推进卡片状态(SM-2)。
 * EF 每次都更新(标准 SM-2),下限 1.3;答错重置重复次数、间隔回到 1 天。
 */
export function reviewCard(state: CardState, grade: Grade): CardState {
  const q = gradeToQuality(grade);
  let ease = state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = Math.max(MIN_EASE, round2(ease));

  let reps = state.reps;
  let intervalDays: number;
  if (q < 3) {
    reps = 0;
    intervalDays = 1; // 遗忘:明天再练
  } else {
    if (reps === 0) intervalDays = 1;
    else if (reps === 1) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * ease);
    reps += 1;
  }
  return { ease, reps, intervalDays };
}

/** 间隔是否达到「成熟卡」门槛(牢记) */
export function isMature(intervalDays: number): boolean {
  return intervalDays >= MATURE_INTERVAL_DAYS;
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

/** 每轮复习最多引入的新词数(保证新词不被一堆生疏复习词挤占) */
export const NEW_PER_SESSION = 4;

/**
 * 从今日到期卡里挑一轮(最多 limit 张):
 * 新词(从未复习过,intervalDays===0)和复习词分桶,先保证若干新词进场、其余给复习,
 * 空位再用新词补满。否则按 ease 升序排时,新词(ease=2.5 最高)永远排在生疏词后面被饿死。
 * 入参假定已按复习优先级(ease 升序)排好;两桶各自保持入参相对顺序。纯函数。
 */
export function pickSession<T extends { intervalDays: number }>(
  due: T[],
  limit: number,
  newPerSession: number = NEW_PER_SESSION
): T[] {
  const fresh = due.filter((c) => c.intervalDays === 0);
  const reviews = due.filter((c) => c.intervalDays > 0);
  const newCount = Math.min(newPerSession, fresh.length, limit);
  const picked = [...fresh.slice(0, newCount), ...reviews.slice(0, limit - newCount)];
  if (picked.length < limit) {
    picked.push(...fresh.slice(newCount, newCount + (limit - picked.length)));
  }
  return picked.slice(0, limit);
}
