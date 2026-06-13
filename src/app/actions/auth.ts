"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getSessionParent } from "@/lib/session";
import { ACTIVE_CHILD_COOKIE, MAX_CHILDREN } from "@/lib/active-child";

const ACTIVE_CHILD_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

/**
 * 家长注册制(儿童个人信息合规的根基):
 * 注册主体是家长手机号,孩子只以子档案存在。
 * MVP 用手机号+密码;生产环境上线前接入短信验证码(见 README 待办)。
 */
export async function register(_prev: { error: string } | null, formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^1\d{10}$/.test(phone)) return { error: "请输入 11 位手机号" };
  if (password.length < 8) return { error: "密码至少 8 位" };

  const exists = await prisma.parent.findUnique({ where: { phone } });
  if (exists) return { error: "该手机号已注册,请直接登录" };

  const parent = await prisma.parent.create({
    data: { phone, passwordHash: await hash(password, 10) },
  });
  await createSession(parent.id);
  redirect("/onboarding");
}

export async function login(_prev: { error: string } | null, formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const parent = await prisma.parent.findUnique({
    where: { phone },
    include: { children: true },
  });
  if (!parent || !(await compare(password, parent.passwordHash))) {
    return { error: "手机号或密码不正确" };
  }
  await createSession(parent.id);
  redirect(parent.children.length === 0 ? "/onboarding" : "/home");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function createChild(_prev: { error: string } | null, formData: FormData) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");

  const nickname = String(formData.get("nickname") ?? "").trim();
  const interests = formData.getAll("interests").map(String);

  if (!/^[A-Za-z]{2,12}$/.test(nickname)) {
    return { error: "请填孩子的英文名/昵称(2-12 个英文字母,不要用真实姓名)" };
  }
  if (interests.length === 0) return { error: "至少选一个孩子喜欢的主题" };
  if (parent.children.length >= MAX_CHILDREN) {
    return { error: `一个账号最多 ${MAX_CHILDREN} 个孩子档案` };
  }

  const child = await prisma.child.create({
    data: {
      parentId: parent.id,
      nickname,
      interests: JSON.stringify(interests),
    },
  });
  // 新建的孩子设为当前活跃,接着去做入级测评
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CHILD_COOKIE, child.id, ACTIVE_CHILD_COOKIE_OPTS);
  redirect("/placement");
}

/** 切换当前活跃孩子(多孩子档案,BACKLOG#4):只允许切到本账号名下的孩子 */
export async function switchChild(childId: string) {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  if (!parent.children.some((c) => c.id === childId)) return;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CHILD_COOKIE, childId, ACTIVE_CHILD_COOKIE_OPTS);
  revalidatePath("/home");
}
