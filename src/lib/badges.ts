/**
 * 徽章系统(游戏化·成就感)——纯逻辑,不碰数据库。
 *
 * 设计原则:
 *  - 所有触发条件只挂在【已有的真实学习信号】上(读完数/连读/答题全对/掌握生词/成长级别),
 *    不引入可被"刷量略读"骗取的指标。
 *  - 一旦解锁【永不撤销】(positive-only,不制造焦虑);页面展示的"已得"以持久化记录为准,
 *    locked 徽章按当前进度显示 cur/target 给孩子一个够得着的目标。
 */

export type BadgeCategory = "读量" | "坚持" | "掌握" | "成长";

/** 评估徽章用的真实统计(由 badges-store.getBadgeStats 从 DB 汇总) */
export interface BadgeStats {
  /** 读完的不同故事数(distinct storyId) */
  storiesRead: number;
  /** 累计打卡天数(distinct dateKey) */
  daysActive: number;
  /** 当前连续打卡天数 */
  streak: number;
  /** 读后答题全对的次数 */
  perfectQuizzes: number;
  /** 生词本收集的词数 */
  wordbookSize: number;
  /** 牢记/出师的词数(SM-2 成熟卡:间隔≥21天;只升不降) */
  wordsMastered: number;
  /** 累计英文阅读量(词) */
  wordsRead: number;
  /** 当前阅读级别 */
  level: number;
  /** 曾在早上 8 点前读过(早起鸟) */
  earlyBird: boolean;
}

export interface BadgeDef {
  key: string;
  name: string;
  desc: string;
  icon: string;
  category: BadgeCategory;
  /** 是否达成(用于发放) */
  earned: (s: BadgeStats) => boolean;
  /** 进度(locked 徽章展示 cur/target) */
  progress: (s: BadgeStats) => { cur: number; target: number };
}

/** 计数型徽章:达到 target 即解锁,并提供 cur/target 进度 */
function count(
  key: string,
  name: string,
  icon: string,
  category: BadgeCategory,
  desc: string,
  get: (s: BadgeStats) => number,
  target: number
): BadgeDef {
  return {
    key,
    name,
    desc,
    icon,
    category,
    earned: (s) => get(s) >= target,
    progress: (s) => ({ cur: Math.min(get(s), target), target }),
  };
}

/** 布尔型徽章:满足条件即解锁(进度 0/1) */
function flag(
  key: string,
  name: string,
  icon: string,
  category: BadgeCategory,
  desc: string,
  ok: (s: BadgeStats) => boolean
): BadgeDef {
  return {
    key,
    name,
    desc,
    icon,
    category,
    earned: ok,
    progress: (s) => ({ cur: ok(s) ? 1 : 0, target: 1 }),
  };
}

/** 徽章目录(展示顺序即此顺序);可持续扩充 */
export const BADGES: BadgeDef[] = [
  // —— 读量 ——
  count("first-story", "初读", "📖", "读量", "读完第一篇故事", (s) => s.storiesRead, 1),
  count("read-5", "小书虫", "📚", "读量", "读完 5 篇故事", (s) => s.storiesRead, 5),
  count("read-20", "书虫达人", "🦉", "读量", "读完 20 篇故事", (s) => s.storiesRead, 20),
  count("read-50", "阅读家", "🏆", "读量", "读完 50 篇故事", (s) => s.storiesRead, 50),
  // —— 坚持 ——
  count("streak-3", "起步", "⚡", "坚持", "连续阅读 3 天", (s) => s.streak, 3),
  count("streak-7", "一周不断", "🔥", "坚持", "连续阅读 7 天", (s) => s.streak, 7),
  count("streak-14", "习惯养成", "🌟", "坚持", "连续阅读 14 天", (s) => s.streak, 14),
  count("days-30", "月度学员", "📅", "坚持", "累计打卡 30 天", (s) => s.daysActive, 30),
  flag("early-bird", "早起鸟", "🌅", "坚持", "早上 8 点前读过一篇", (s) => s.earlyBird),
  // —— 掌握 ——
  count("perfect-1", "满分!", "⭐", "掌握", "一次读后答题全对", (s) => s.perfectQuizzes, 1),
  count("perfect-10", "满分学者", "🏅", "掌握", "10 次答题全对", (s) => s.perfectQuizzes, 10),
  count("words-10", "词芽", "🌱", "掌握", "生词本收集 10 个词", (s) => s.wordbookSize, 10),
  count("words-50", "词林", "🌳", "掌握", "生词本收集 50 个词", (s) => s.wordbookSize, 50),
  count(
    "master-20",
    "记词高手",
    "🎯",
    "掌握",
    "牢记 20 个词(间隔复习出师)",
    (s) => s.wordsMastered,
    20
  ),
  // —— 成长 ——
  count("level-5", "含苞", "🌸", "成长", "成长到 Level 5", (s) => s.level, 5),
  count("level-8", "溪流", "🌊", "成长", "成长到 Level 8", (s) => s.level, 8),
];

export const BADGE_TOTAL = BADGES.length;

/** 当前达成(满足条件)的徽章 key 列表;awardBadges 用它和已发放的取差集来发新徽章 */
export function evaluateBadges(s: BadgeStats): string[] {
  return BADGES.filter((b) => b.earned(s)).map((b) => b.key);
}

export function getBadge(key: string): BadgeDef | undefined {
  return BADGES.find((b) => b.key === key);
}
