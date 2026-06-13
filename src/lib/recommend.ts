import { prisma } from "./db";
import { parseInterests } from "./story-types";

/**
 * 今日推荐:
 *   1. 优先孩子当前级别 + 兴趣轨道内、未读过的故事
 *   2. 轨道内读完了,放宽到当前级别任意主题
 *   3. 当前级别读完了,尝试相邻级别(±1)
 */
export async function recommendStory(childId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return null;
  const interests = parseInterests(child.interests);

  const readIds = (
    await prisma.reading.findMany({ where: { childId }, select: { storyId: true } })
  ).map((r) => r.storyId);

  const tryFind = async (levelIds: number[], withInterest: boolean) =>
    prisma.story.findFirst({
      where: {
        status: "published",
        levelId: { in: levelIds },
        id: { notIn: readIds },
        ...(withInterest && interests.length > 0 ? { interest: { in: interests } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

  return (
    (await tryFind([child.levelId], true)) ??
    (await tryFind([child.levelId], false)) ??
    (await tryFind([child.levelId - 1, child.levelId + 1], true)) ??
    (await tryFind([child.levelId - 1, child.levelId + 1], false))
  );
}
