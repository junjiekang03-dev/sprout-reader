/**
 * 多孩子档案:活跃孩子的选择(BACKLOG#4)。
 *
 * 一个家长可有多个孩子(Child),主页可切换。「当前活跃孩子」记在 cookie 里(按设备),
 * 这里只放不依赖运行环境的纯逻辑,便于单测;读 cookie 的 getActiveChild 在 session.ts。
 */

export const ACTIVE_CHILD_COOKIE = "sprout_active_child";

/** 一个家长最多可建的孩子数(防滥用;够覆盖一家的孩子数) */
export const MAX_CHILDREN = 6;

/**
 * 纯函数:从孩子列表里挑出「当前活跃」的孩子。
 * 命中 activeId 用它;否则(无 cookie / cookie 失效 / 换了设备)回退到第一个;空列表返回 null。
 */
export function resolveActiveChild<T extends { id: string }>(
  children: T[],
  activeId: string | undefined
): T | null {
  if (children.length === 0) return null;
  return children.find((c) => c.id === activeId) ?? children[0];
}
