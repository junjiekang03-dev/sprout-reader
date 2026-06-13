import { prisma } from "./db";
import { dateKeyOf } from "./story-types";
import { scheduleNext, isDue, dueDateAfter } from "./srs";

/**
 * 记录一次查词:词进生词本。
 * 已存在的词不重置复习进度(只是又遇到一次,不打扰已建立的记忆节奏)。
 * 新词进 box 1,今天即到期。
 */
export async function recordLookup(childId: string, rawWord: string, zh: string) {
  const word = rawWord.toLowerCase().replace(/[^a-z']/g, "");
  // 只收有中文释义的生词(故事 glossary 词,即该级别目标新词);
  // 孩子随手点的普通词没有释义,不灌进生词本
  if (word.length < 2 || !zh) return;
  const today = dateKeyOf(new Date());
  await prisma.wordbookEntry.upsert({
    where: { childId_word: { childId, word } },
    create: { childId, word, zh: zh ?? "", box: 1, dueDateKey: today },
    update: { zh: zh || undefined }, // 有新释义则补,不动复习进度
  });
}

/** 今日待复习的词(到期的,按盒子低的优先——越生疏越先练) */
export async function getDueWords(childId: string, limit = 12) {
  const today = dateKeyOf(new Date());
  const all = await prisma.wordbookEntry.findMany({
    where: { childId },
    orderBy: [{ box: "asc" }, { dueDateKey: "asc" }],
  });
  return all.filter((w) => isDue(w.dueDateKey, today)).slice(0, limit);
}

/** 待复习数量(主页入口角标用) */
export async function getDueCount(childId: string) {
  const today = dateKeyOf(new Date());
  const all = await prisma.wordbookEntry.findMany({
    where: { childId },
    select: { dueDateKey: true },
  });
  return all.filter((w) => isDue(w.dueDateKey, today)).length;
}

/** 生词本总词数 */
export async function getWordbookSize(childId: string) {
  return prisma.wordbookEntry.count({ where: { childId } });
}

/** 提交一次复习结果,推进 Leitner 盒子并排下次复习 */
export async function submitReview(childId: string, word: string, correct: boolean) {
  const entry = await prisma.wordbookEntry.findUnique({
    where: { childId_word: { childId, word } },
  });
  if (!entry) return;
  const { box, intervalDays } = scheduleNext(entry.box, correct);
  const today = dateKeyOf(new Date());
  await prisma.wordbookEntry.update({
    where: { id: entry.id },
    data: {
      box,
      dueDateKey: dueDateAfter(today, intervalDays),
      timesCorrect: entry.timesCorrect + (correct ? 1 : 0),
      timesWrong: entry.timesWrong + (correct ? 0 : 1),
      lastReviewedAt: new Date(),
    },
  });
}
