import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { getStreak, getLevelSuggestion } from "@/lib/stats";
import { awardBadges } from "@/lib/badges-store";
import { decideAutoLevelChange } from "@/lib/progression";
import { parseQuestions, dateKeyOf } from "@/lib/story-types";

/** 提交读后测验:服务端判分并记录阅读(同一天重复读同一篇只记一次) */
export async function POST(req: Request) {
  const parent = await getSessionParent();
  if (!parent) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const child = await getActiveChild(parent.children);
  if (!child) return NextResponse.json({ error: "没有孩子档案" }, { status: 400 });

  const body = (await req.json()) as {
    storyId: string;
    answers: number[];
    durationSec: number;
  };

  const story = await prisma.story.findUnique({ where: { id: body.storyId } });
  if (!story) return NextResponse.json({ error: "故事不存在" }, { status: 404 });

  const questions = parseQuestions(story.questionsJson);
  const total = questions.length;
  const correct = questions.reduce((sum, q, i) => sum + (body.answers[i] === q.answer ? 1 : 0), 0);

  const dateKey = dateKeyOf(new Date());
  await prisma.reading.upsert({
    where: {
      childId_storyId_dateKey: { childId: child.id, storyId: story.id, dateKey },
    },
    create: {
      childId: child.id,
      storyId: story.id,
      dateKey,
      correctCount: correct,
      totalCount: total,
      durationSec: Math.max(0, Math.min(7200, Math.round(body.durationSec || 0))),
    },
    update: { correctCount: correct, totalCount: total },
  });

  // 自动跟随难度(BACKLOG#3):开启时,命中升/降建议则自动调一级并记录(家长可在主页撤销)
  let levelChange: { fromLevel: number; toLevel: number; direction: "up" | "down" } | null = null;
  if (child.autoFollowLevel) {
    const suggestion = await getLevelSuggestion(child.id, child.levelId);
    const decision = decideAutoLevelChange({
      autoFollow: true,
      currentLevel: child.levelId,
      suggestion,
    });
    if (decision) {
      await prisma.$transaction([
        prisma.child.update({ where: { id: child.id }, data: { levelId: decision.toLevel } }),
        prisma.levelChange.create({
          data: {
            childId: child.id,
            fromLevel: decision.fromLevel,
            toLevel: decision.toLevel,
            direction: decision.direction,
            auto: true,
          },
        }),
      ]);
      levelChange = decision;
    }
  }

  // 游戏化:读完后评估并发放新解锁的徽章(在记录阅读 + 可能的调级之后,挂在真实信号上)
  const newBadges = await awardBadges(child.id);

  const streak = await getStreak(child.id);
  return NextResponse.json({ correct, total, streak, levelChange, newBadges });
}
