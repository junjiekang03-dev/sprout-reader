import { describe, it, expect } from "vitest";
import { BADGES, BADGE_TOTAL, evaluateBadges, getBadge, type BadgeStats } from "../badges";

function stats(over: Partial<BadgeStats> = {}): BadgeStats {
  return {
    storiesRead: 0,
    daysActive: 0,
    streak: 0,
    perfectQuizzes: 0,
    wordbookSize: 0,
    wordsMastered: 0,
    wordsRead: 0,
    level: 1,
    earlyBird: false,
    ...over,
  };
}

describe("徽章评估 evaluateBadges", () => {
  it("零起步(新孩子 level1、无任何记录)不解锁任何徽章", () => {
    expect(evaluateBadges(stats())).toEqual([]);
  });

  it("读完 5 篇 → 解锁 初读 + 小书虫,不解锁书虫达人", () => {
    const got = evaluateBadges(stats({ storiesRead: 5 }));
    expect(got).toContain("first-story");
    expect(got).toContain("read-5");
    expect(got).not.toContain("read-20");
  });

  it("连读阈值边界:连读 7 天解锁 3/7 天,不解锁 14 天", () => {
    const got = evaluateBadges(stats({ streak: 7 }));
    expect(got).toEqual(expect.arrayContaining(["streak-3", "streak-7"]));
    expect(got).not.toContain("streak-14");
  });

  it("早起鸟为布尔信号", () => {
    expect(evaluateBadges(stats({ earlyBird: true }))).toContain("early-bird");
    expect(evaluateBadges(stats({ earlyBird: false }))).not.toContain("early-bird");
  });

  it("成长级别 8 同时解锁 含苞(L5)与 溪流(L8)", () => {
    const got = evaluateBadges(stats({ level: 8 }));
    expect(got).toEqual(expect.arrayContaining(["level-5", "level-8"]));
  });

  it("掌握类挂在'真学了'信号:答题全对/出师词数/生词量", () => {
    expect(evaluateBadges(stats({ perfectQuizzes: 1 }))).toContain("perfect-1");
    expect(evaluateBadges(stats({ perfectQuizzes: 10 }))).toContain("perfect-10");
    expect(evaluateBadges(stats({ wordsMastered: 20 }))).toContain("master-20");
    expect(evaluateBadges(stats({ wordbookSize: 50 }))).toEqual(
      expect.arrayContaining(["words-10", "words-50"])
    );
  });

  it("拉满所有信号 → 解锁全部 16 枚", () => {
    const full = stats({
      storiesRead: 50,
      daysActive: 30,
      streak: 14,
      perfectQuizzes: 10,
      wordbookSize: 50,
      wordsMastered: 20,
      wordsRead: 99999,
      level: 8,
      earlyBird: true,
    });
    expect(evaluateBadges(full).length).toBe(BADGE_TOTAL);
    expect(BADGE_TOTAL).toBe(16);
  });
});

describe("徽章进度 progress", () => {
  it("未达成时给出 cur/target", () => {
    const b = getBadge("read-5")!;
    expect(b.progress(stats({ storiesRead: 3 }))).toEqual({ cur: 3, target: 5 });
  });

  it("超出 target 的 cur 封顶到 target", () => {
    const b = getBadge("read-5")!;
    expect(b.progress(stats({ storiesRead: 10 }))).toEqual({ cur: 5, target: 5 });
  });

  it("每枚徽章 key 唯一", () => {
    const keys = BADGES.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
