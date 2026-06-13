import { prisma } from "./db";
import { dateKeyOf } from "./story-types";

/** 连续打卡天数(从今天或昨天往前数,缺一天即断) */
export async function getStreak(childId: string): Promise<number> {
  const readings = await prisma.reading.findMany({
    where: { childId },
    select: { dateKey: true },
    distinct: ["dateKey"],
    orderBy: { dateKey: "desc" },
  });
  const days = new Set(readings.map((r) => r.dateKey));
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  // 今天还没读不算断,从昨天开始也可以起算
  if (!days.has(dateKeyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKeyOf(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** 最近 N 天的打卡日历数据 */
export async function getCalendar(childId: string, daysBack = 28) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack + 1);
  const readings = await prisma.reading.findMany({
    where: { childId, dateKey: { gte: dateKeyOf(since) } },
    select: { dateKey: true },
  });
  const counts = new Map<string, number>();
  for (const r of readings) counts.set(r.dateKey, (counts.get(r.dateKey) ?? 0) + 1);

  const cells: { dateKey: string; count: number }[] = [];
  const cursor = new Date(since);
  const today = dateKeyOf(new Date());
  while (dateKeyOf(cursor) <= today) {
    const key = dateKeyOf(cursor);
    cells.push({ dateKey: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  storiesRead: number;
  daysActive: number;
  wordsRead: number;
  correctRate: number; // 0-1
  newWordsMet: number; // 词汇表生词接触数(按故事 glossary 计)
}

/** 家长周报:统计最近 7 天 */
export async function getWeeklyReport(childId: string): Promise<WeeklyReport> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  const readings = await prisma.reading.findMany({
    where: { childId, dateKey: { gte: dateKeyOf(start), lte: dateKeyOf(end) } },
    include: { story: { select: { wordCount: true, glossaryJson: true } } },
  });

  const daysActive = new Set(readings.map((r) => r.dateKey)).size;
  const wordsRead = readings.reduce((sum, r) => sum + r.story.wordCount, 0);
  const totalQ = readings.reduce((s, r) => s + r.totalCount, 0);
  const correctQ = readings.reduce((s, r) => s + r.correctCount, 0);
  const newWordsMet = readings.reduce((s, r) => {
    try {
      return s + (JSON.parse(r.story.glossaryJson) as unknown[]).length;
    } catch {
      return s;
    }
  }, 0);

  return {
    weekStart: dateKeyOf(start),
    weekEnd: dateKeyOf(end),
    storiesRead: readings.length,
    daysActive,
    wordsRead,
    correctRate: totalQ === 0 ? 0 : correctQ / totalQ,
    newWordsMet,
  };
}
