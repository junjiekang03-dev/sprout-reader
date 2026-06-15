/**
 * 成长地图(游戏化·进度视图)——纯逻辑,不碰数据库。
 *
 * 把现有 15 级成长体系做成一条「闯关路径」:已通过 / 当前 / 未解锁。
 * 设计原则(同徽章 badges.ts / 萌宠 pet.ts):
 *  - 完全由【已有真实信号】派生(孩子当前 Level + 各级已读 Story 数),
 *    不引入新经济、不新建表——这是「进度视图」,不是新系统。
 *  - 只前进、不羞辱:未解锁的关只是「还没到」,不展示失败/退步,不施压。
 */
import { LEVELS, getLevel, type Level } from "./levels";

export type NodeStatus = "cleared" | "current" | "locked";

export interface LevelNode {
  level: Level;
  status: NodeStatus;
  /** 该级别已读的不同 Story 数(真实信号) */
  readCount: number;
  /** 该级别已发布的 Story 数 */
  storyCount: number;
}

export interface LevelMap {
  /** 15 个节点,按级别升序(L1 → L15) */
  nodes: LevelNode[];
  /** 钳制到 [1, totalLevels] 后的当前级别 */
  currentLevel: number;
  current: Level;
  /** 当前级别之下、已通过的关数 */
  clearedCount: number;
  totalLevels: number;
  /** 全部级别已读不同 Story 总数 */
  totalRead: number;
}

export const TOTAL_LEVELS = LEVELS.length; // 15

/** 防御性钳制:越界 / 非法输入回到合法级别,绝不抛错(进度视图不该因脏数据炸页面) */
function clampLevel(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(TOTAL_LEVELS, Math.max(1, Math.round(n)));
}

export function buildLevelMap(input: {
  currentLevel: number;
  readByLevel?: Record<number, number>;
  storyByLevel?: Record<number, number>;
}): LevelMap {
  const currentLevel = clampLevel(input.currentLevel);
  const readByLevel = input.readByLevel ?? {};
  const storyByLevel = input.storyByLevel ?? {};

  const nodes: LevelNode[] = LEVELS.map((level) => {
    const status: NodeStatus =
      level.id < currentLevel ? "cleared" : level.id === currentLevel ? "current" : "locked";
    return {
      level,
      status,
      readCount: readByLevel[level.id] ?? 0,
      storyCount: storyByLevel[level.id] ?? 0,
    };
  });

  return {
    nodes,
    currentLevel,
    current: getLevel(currentLevel),
    clearedCount: currentLevel - 1,
    totalLevels: TOTAL_LEVELS,
    totalRead: Object.values(readByLevel).reduce((a, b) => a + b, 0),
  };
}
