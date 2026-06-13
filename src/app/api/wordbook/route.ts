import { NextResponse } from "next/server";
import { getSessionParent } from "@/lib/session";
import { recordLookup } from "@/lib/wordbook";

/** 记录一次查词(阅读器点词时调用) */
export async function POST(req: Request) {
  const parent = await getSessionParent();
  if (!parent) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const child = parent.children[0];
  if (!child) return NextResponse.json({ error: "无孩子档案" }, { status: 400 });

  const body = (await req.json()) as { word?: string; zh?: string };
  await recordLookup(child.id, String(body.word ?? ""), String(body.zh ?? ""));
  return NextResponse.json({ ok: true });
}
