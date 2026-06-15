import { prisma } from "./db";
import { dateKeyOf } from "./story-types";
import { reviewCard, isMature, dueDateAfter, pickSession, INIT_EASE } from "./srs";

/**
 * 记录一次查词:词进生词本。
 * 已存在的词不重置复习进度(只是又遇到一次,不打扰已建立的记忆节奏)。
 * 新词以 SM-2 初始难度(ease 2.5)入本,今天即到期。
 */
export async function recordLookup(childId: string, rawWord: string, zh: string) {
  const word = rawWord.toLowerCase().replace(/[^a-z']/g, "");
  // 只收有中文释义的生词(故事 glossary 词,即该级别目标新词);
  // 孩子随手点的普通词没有释义,不灌进生词本
  if (word.length < 2 || !zh) return;
  const today = dateKeyOf(new Date());
  await prisma.wordbookEntry.upsert({
    where: { childId_word: { childId, word } },
    create: { childId, word, zh: zh ?? "", ease: INIT_EASE, dueDateKey: today },
    update: { zh: zh || undefined }, // 有新释义则补,不动复习进度
  });
}

/**
 * 今日待复习的词(走 @@index([childId, dueDateKey]):dueDateKey 是 YYYY-MM-DD,
 * 字典序==时序,故 lte today 即「到期」)。复习词按 ease 升序(越生疏越先练),
 * 再用 pickSession 保证新词不被挤占。
 */
export async function getDueWords(childId: string, limit = 12) {
  const today = dateKeyOf(new Date());
  const due = await prisma.wordbookEntry.findMany({
    where: { childId, dueDateKey: { lte: today } },
    orderBy: [{ ease: "asc" }, { dueDateKey: "asc" }],
  });
  return pickSession(due, limit);
}

/** 待复习数量(主页入口角标用;走索引 count,不全表扫) */
export async function getDueCount(childId: string) {
  const today = dateKeyOf(new Date());
  return prisma.wordbookEntry.count({ where: { childId, dueDateKey: { lte: today } } });
}

/** 生词本总词数 */
export async function getWordbookSize(childId: string) {
  return prisma.wordbookEntry.count({ where: { childId } });
}

/** 提交一次复习结果,按 SM-2 推进卡片并排下次复习 */
export async function submitReview(childId: string, word: string, correct: boolean) {
  const entry = await prisma.wordbookEntry.findUnique({
    where: { childId_word: { childId, word } },
  });
  if (!entry) return;

  const next = reviewCard(
    { ease: entry.ease, reps: entry.reps, intervalDays: entry.intervalDays },
    correct ? "good" : "again"
  );
  const today = dateKeyOf(new Date());
  // 成熟标记只设一次、永不清除:即便日后遗忘导致间隔回落,wordsMastered 也只升不降
  const masteredAt = entry.masteredAt ?? (isMature(next.intervalDays) ? new Date() : null);

  await prisma.wordbookEntry.update({
    where: { id: entry.id },
    data: {
      ease: next.ease,
      reps: next.reps,
      intervalDays: next.intervalDays,
      dueDateKey: dueDateAfter(today, next.intervalDays),
      masteredAt,
      lapses: entry.lapses + (correct ? 0 : 1),
      timesCorrect: entry.timesCorrect + (correct ? 1 : 0),
      timesWrong: entry.timesWrong + (correct ? 0 : 1),
      lastReviewedAt: new Date(),
    },
  });
}
