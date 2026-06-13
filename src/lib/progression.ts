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
