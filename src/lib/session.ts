import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "./db";
import { resolveActiveChild, ACTIVE_CHILD_COOKIE } from "./active-child";

const COOKIE_NAME = "sprout_session";
const SESSION_DAYS = 30;

export async function createSession(parentId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await prisma.session.create({ data: { token, parentId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionParent() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { parent: { include: { children: { orderBy: { createdAt: "asc" } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.parent;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(COOKIE_NAME);
  }
}

/**
 * 当前活跃孩子(多孩子档案,BACKLOG#4):cookie 记忆所选孩子,默认第一个。
 * 传入 parent.children(已按 createdAt 升序),返回活跃孩子或 null。
 */
export async function getActiveChild<T extends { id: string }>(children: T[]): Promise<T | null> {
  const cookieStore = await cookies();
  return resolveActiveChild(children, cookieStore.get(ACTIVE_CHILD_COOKIE)?.value);
}
