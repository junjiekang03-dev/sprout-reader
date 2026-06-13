"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionParent } from "@/lib/session";
import { LEVELS } from "@/lib/levels";

/**
 * 接受升降级建议:把孩子的 levelId 调到目标级别。
 * 只信任服务端重新计算的边界(1..15),不直接采信前端传值。
 */
export async function acceptLevelSuggestion(toLevel: number) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = parent.children[0];
  if (!child) redirect("/onboarding");

  const clamped = Math.max(1, Math.min(LEVELS.length, Math.round(toLevel)));
  // 只允许相对当前级别 ±1 的微调,防止被构造请求跳级
  if (Math.abs(clamped - child.levelId) !== 1) return;

  await prisma.child.update({ where: { id: child.id }, data: { levelId: clamped } });
  revalidatePath("/home");
}
