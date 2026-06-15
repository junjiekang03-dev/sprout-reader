/** 成长地图的 DB 胶水层:把真实信号(各级已读 / 已发布 Story 数)喂给纯函数 buildLevelMap。 */
import { prisma } from "./db";
import { buildLevelMap, type LevelMap } from "./level-map";

export async function getLevelMapData(childId: string, currentLevel: number): Promise<LevelMap> {
  const [readings, stories] = await Promise.all([
    prisma.reading.findMany({
      where: { childId },
      select: { storyId: true, story: { select: { levelId: true } } },
    }),
    prisma.story.findMany({ where: { status: "published" }, select: { levelId: true } }),
  ]);

  // 各级「已读不同 Story 数」:同一篇跨天会有多条 Reading,按 storyId 去重(与 badges 口径一致)
  const readByLevel: Record<number, number> = {};
  const seen = new Set<string>();
  for (const r of readings) {
    if (seen.has(r.storyId)) continue;
    seen.add(r.storyId);
    readByLevel[r.story.levelId] = (readByLevel[r.story.levelId] ?? 0) + 1;
  }

  const storyByLevel: Record<number, number> = {};
  for (const s of stories) storyByLevel[s.levelId] = (storyByLevel[s.levelId] ?? 0) + 1;

  return buildLevelMap({ currentLevel, readByLevel, storyByLevel });
}
