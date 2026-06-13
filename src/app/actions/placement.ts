"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { LEVELS } from "@/lib/levels";

export async function savePlacement(levelId: number) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");

  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  const clamped = Math.max(1, Math.min(LEVELS.length, Math.round(levelId)));
  await prisma.child.update({
    where: { id: child.id },
    data: { levelId: clamped, placementDone: true },
  });
  redirect("/home");
}
