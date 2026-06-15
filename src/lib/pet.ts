/**
 * 萌宠养成(游戏化)——纯逻辑,不碰数据库。
 *
 * 设计原则(同徽章):
 *  - 成长值【完全由已有真实学习信号派生】(读完/答题全对/掌握生词/连读),不引入可刷量的独立经济。
 *  - 【只长不掉】:成长值随累计真实学习单调增长,阶段只升不降(positive-only,不制造焦虑)。
 *  - 刻意做简单:3 只可选、各 3 个成长阶段。
 */

import type { BadgeStats } from "./badges";

export type SpeciesKey = "dragon" | "owl" | "fox";

export interface Species {
  key: SpeciesKey;
  name: string; // 成年形态名
  element: string; // 元素(展示用)
  blurb: string; // 一句介绍(选择页)
  /** 三个成长阶段名:幼 / 少年 / 成年 */
  stageNames: [string, string, string];
}

export const SPECIES: Species[] = [
  {
    key: "dragon",
    name: "芽芽龙",
    element: "🌱 大地",
    blurb: "忠诚的伙伴,陪你把新词种进记忆里",
    stageNames: ["小芽龙", "翼芽龙", "芽芽龙"],
  },
  {
    key: "owl",
    name: "星愿鸦",
    element: "🌟 智慧",
    blurb: "睿智的星鸦,陪你读懂更难的故事",
    stageNames: ["雏星鸦", "星羽鸦", "星愿鸦"],
  },
  {
    key: "fox",
    name: "曦光狐",
    element: "☀️ 光芒",
    blurb: "活力的光狐,陪你每天坚持不间断",
    stageNames: ["小光狐", "流光狐", "曦光狐"],
  },
];

export function getSpecies(key: string): Species | undefined {
  return SPECIES.find((s) => s.key === key);
}

/** 萌宠插画路径:public/illustrations/pets/<species>-<stage>.png */
export function petImage(species: string, stage: number): string {
  return `/illustrations/pets/${species}-${stage}.png`;
}

/** 阶段起点阈值(3 个阶段:0/1/2);成长值跨过即进化 */
const THRESHOLDS = [0, 60, 180];
export const MAX_STAGE = THRESHOLDS.length - 1; // 2

/**
 * 成长值 = 真实学习信号的加权和(偏向"真学了"):
 *  读完一篇 +10、读后全对 +8、牢记一个词 +6、连读每天 +3(封顶 30 天)。
 */
export function petScore(s: BadgeStats): number {
  return (
    s.storiesRead * 10 + s.perfectQuizzes * 8 + s.wordsMastered * 6 + Math.min(s.streak, 30) * 3
  );
}

export function petStage(score: number): number {
  let stage = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) if (score >= THRESHOLDS[i]) stage = i;
  return stage;
}

export interface PetProgress {
  stage: number;
  /** 当前阶段内已积累 / 本阶段所需 */
  into: number;
  span: number;
  pct: number; // 0-100
  /** 距下一次进化还差多少成长值;成年则 0 */
  toNext: number;
  atMax: boolean;
}

export function petProgress(score: number): PetProgress {
  const stage = petStage(score);
  if (stage >= MAX_STAGE) {
    return { stage, into: 1, span: 1, pct: 100, toNext: 0, atMax: true };
  }
  const lo = THRESHOLDS[stage];
  const hi = THRESHOLDS[stage + 1];
  const into = score - lo;
  const span = hi - lo;
  return {
    stage,
    into,
    span,
    pct: Math.round((into / span) * 100),
    toNext: hi - score,
    atMax: false,
  };
}
