"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * 内容管线第 3 层:人工通读后发布。
 * MVP 鉴权:校验 ADMIN_KEY(由 /admin?key=... 透传)。生产应换成真正的后台登录。
 */
function assertAdmin(key: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || key !== expected) throw new Error("无权限");
}

export async function publishStory(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  const storyId = String(formData.get("storyId") ?? "");
  assertAdmin(key);
  await prisma.story.update({ where: { id: storyId }, data: { status: "published" } });
  revalidatePath("/admin");
}

export async function rejectStory(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  const storyId = String(formData.get("storyId") ?? "");
  assertAdmin(key);
  // 退回:从库中删除该 draft(源 JSON 文件仍在,可修订后重新 seed)
  await prisma.story.delete({ where: { id: storyId } });
  revalidatePath("/admin");
}
