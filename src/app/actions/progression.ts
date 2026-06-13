"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { LEVELS } from "@/lib/levels";

/**
 * 接受升降级建议:把孩子的 levelId 调到目标级别。
 * 只信任服务端重新计算的边界(1..15),不直接采信前端传值。
 */
export async function acceptLevelSuggestion(toLevel: number) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  const clamped = Math.max(1, Math.min(LEVELS.length, Math.round(toLevel)));
  // 只允许相对当前级别 ±1 的微调,防止被构造请求跳级
  if (Math.abs(clamped - child.levelId) !== 1) return;

  await prisma.child.update({ where: { id: child.id }, data: { levelId: clamped } });
  revalidatePath("/home");
}

/** 开关「自动跟随难度」(BACKLOG#3):开启后,命中升/降建议时阅读提交会自动调一级 */
export async function setAutoFollowLevel(enabled: boolean) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");
  await prisma.child.update({ where: { id: child.id }, data: { autoFollowLevel: enabled } });
  revalidatePath("/home");
}

/** 撤销一次自动调级:把级别还原到调级前,并标记该记录已撤销 */
export async function undoLevelChange(changeId: string) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  const change = await prisma.levelChange.findUnique({ where: { id: changeId } });
  // 只允许撤销本孩子、尚未撤销的记录
  if (!change || change.childId !== child.id || change.undone) return;

  await prisma.$transaction([
    prisma.child.update({ where: { id: child.id }, data: { levelId: change.fromLevel } }),
    prisma.levelChange.update({ where: { id: change.id }, data: { undone: true } }),
  ]);
  revalidatePath("/home");
}
