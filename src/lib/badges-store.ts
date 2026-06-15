/** 徽章系统的 DB 胶水层:从已有真实信号汇总统计、发放(永不撤销)、读取已得。 */
import { prisma } from "./db";
import { getStreak } from "./stats";
import { evaluateBadges, getBadge, type BadgeStats } from "./badges";

const LEITNER_MAX_BOX = 5; // 见 srs.ts MAX_BOX:升到最高盒即视为"出师/牢记"

/** 从已有数据汇总徽章统计(全部真实信号,不引入可刷量的指标) */
export async function getBadgeStats(childId: string): Promise<BadgeStats> {
  const [child, readings, wordbookSize, wordsMastered, streak] = await Promise.all([
    prisma.child.findUnique({ where: { id: childId }, select: { levelId: true } }),
    prisma.reading.findMany({
      where: { childId },
      select: {
        storyId: true,
        dateKey: true,
        correctCount: true,
        totalCount: true,
        createdAt: true,
        story: { select: { wordCount: true } },
      },
    }),
    prisma.wordbookEntry.count({ where: { childId } }),
    prisma.wordbookEntry.count({ where: { childId, box: LEITNER_MAX_BOX } }),
    getStreak(childId),
  ]);

  return {
    storiesRead: new Set(readings.map((r) => r.storyId)).size,
    daysActive: new Set(readings.map((r) => r.dateKey)).size,
    streak,
    perfectQuizzes: readings.filter((r) => r.totalCount > 0 && r.correctCount === r.totalCount)
      .length,
    wordbookSize,
    wordsMastered,
    wordsRead: readings.reduce((sum, r) => sum + r.story.wordCount, 0),
    level: child?.levelId ?? 1,
    earlyBird: readings.some((r) => r.createdAt.getHours() < 8), // 早上 8 点前(服务器本地时区,与打卡口径一致)
  };
}

/**
 * 评估并发放新达成的徽章(已得的不重复发,永不撤销)。
 * 返回【本次新解锁】的徽章展示信息,供阅读结果页庆祝。
 */
export async function awardBadges(
  childId: string
): Promise<{ key: string; name: string; icon: string }[]> {
  const stats = await getBadgeStats(childId);
  const eligible = evaluateBadges(stats);
  const existing = await prisma.childBadge.findMany({
    where: { childId },
    select: { badgeKey: true },
  });
  const have = new Set(existing.map((b) => b.badgeKey));
  const fresh = eligible.filter((k) => !have.has(k));

  for (const key of fresh) {
    // upsert 防并发/重复(SQLite 不支持 createMany skipDuplicates)
    await prisma.childBadge.upsert({
      where: { childId_badgeKey: { childId, badgeKey: key } },
      create: { childId, badgeKey: key },
      update: {},
    });
  }

  return fresh.map((key) => {
    const d = getBadge(key)!;
    return { key, name: d.name, icon: d.icon };
  });
}

/** 已得徽章 key → 解锁时间 */
export async function getEarnedBadges(childId: string): Promise<Map<string, Date>> {
  const rows = await prisma.childBadge.findMany({ where: { childId } });
  return new Map(rows.map((r) => [r.badgeKey, r.earnedAt]));
}

/** 徽章墙页面数据:进墙时补发老进度已达成的徽章,再返回统计 + 已得集合 */
export async function getBadgeWallData(childId: string) {
  await awardBadges(childId);
  const [stats, earned] = await Promise.all([getBadgeStats(childId), getEarnedBadges(childId)]);
  return { stats, earned };
}
