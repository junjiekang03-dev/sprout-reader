import { NextResponse } from "next/server";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { submitReview } from "@/lib/wordbook";

/** 提交一次复习结果,按 SM-2 推进卡片 */
export async function POST(req: Request) {
  const parent = await getSessionParent();
  if (!parent) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const child = await getActiveChild(parent.children);
  if (!child) return NextResponse.json({ error: "无孩子档案" }, { status: 400 });

  const body = (await req.json()) as { word?: string; correct?: boolean };
  await submitReview(child.id, String(body.word ?? ""), Boolean(body.correct));
  return NextResponse.json({ ok: true });
}
