/**
 * 升降级建议:根据孩子最近的阅读表现,建议升/降一级或保持不动。
 * 纯函数,不碰数据库——调用方负责取数(最近的记录排在前面)。
 */

export interface ReadingSample {
  /** 该篇故事的级别 */
  storyLevelId: number;
  correctCount: number;
  totalCount: number;
}

export interface LevelSuggestion {
  direction: "up" | "down";
  toLevel: number;
}

import { LEVELS } from "./levels";

const UP_WINDOW = 5;
const UP_THRESHOLD = 0.9;
const DOWN_WINDOW = 3;
const DOWN_THRESHOLD = 0.4;
const MAX_LEVEL = LEVELS.length;

function correctRate(samples: ReadingSample[]): number {
  const total = samples.reduce((s, r) => s + r.totalCount, 0);
  if (total === 0) return 0;
  return samples.reduce((s, r) => s + r.correctCount, 0) / total;
}

export function suggestLevelChange(input: {
  currentLevel: number;
  readings: ReadingSample[];
}): LevelSuggestion | null {
  const atLevel = input.readings.filter((r) => r.storyLevelId === input.currentLevel);

  // 降级优先于升级:孩子在挫败时,最重要的是马上回到舒适区
  const struggling = atLevel.slice(0, DOWN_WINDOW);
  if (
    struggling.length >= DOWN_WINDOW &&
    input.currentLevel > 1 &&
    correctRate(struggling) <= DOWN_THRESHOLD
  ) {
    return { direction: "down", toLevel: input.currentLevel - 1 };
  }

  const recent = atLevel.slice(0, UP_WINDOW);
  if (recent.length >= UP_WINDOW && input.currentLevel < MAX_LEVEL) {
    if (correctRate(recent) >= UP_THRESHOLD) {
      return { direction: "up", toLevel: input.currentLevel + 1 };
    }
  }
  return null;
}

export interface AutoLevelDecision {
  fromLevel: number;
  toLevel: number;
  direction: "up" | "down";
}

/**
 * 自动跟随的调度纯函数:在「自动调级」开启且命中升/降建议时,决定是否自动调级、调到几级。
 * 复用 suggestLevelChange 的输出(LevelSuggestion)。
 *
 * - 自动跟随关闭 → null(走手动横幅路径,家长自己点接受)
 * - 没有建议 → null
 * - 有建议 → 返回具体调级动作;防御性地只接受相对当前级别 ±1 且在 [1, MAX] 内的目标
 *   (与 acceptLevelSuggestion 的边界一致,杜绝异常输入造成跳级)。
 *
 * 不做防抖:调级后新级别尚无阅读记录,suggestLevelChange 在攒够新级别样本前不会再触发,
 * 天然避免来回横跳;真出现「升上去又吃力」是合理的纠偏,不应抑制。
 */
export function decideAutoLevelChange(input: {
  autoFollow: boolean;
  currentLevel: number;
  suggestion: LevelSuggestion | null;
}): AutoLevelDecision | null {
  if (!input.autoFollow || !input.suggestion) return null;
  const to = input.suggestion.toLevel;
  if (to < 1 || to > MAX_LEVEL) return null;
  if (Math.abs(to - input.currentLevel) !== 1) return null;
  return { fromLevel: input.currentLevel, toLevel: to, direction: input.suggestion.direction };
}
