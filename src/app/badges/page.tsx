import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { getBadgeWallData } from "@/lib/badges-store";
import { BADGES, BADGE_TOTAL, type BadgeCategory } from "@/lib/badges";

const CATEGORIES: BadgeCategory[] = ["读量", "坚持", "掌握", "成长"];

export default async function BadgesPage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  // 进墙时补发老进度已达成的徽章,再取统计 + 已得集合
  const { stats, earned } = await getBadgeWallData(child.id);
  const earnedCount = earned.size;
  const pct = Math.round((earnedCount / BADGE_TOTAL) * 100);

  return (
    <main className="mx-auto max-w-md px-5 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-sm text-faint">
          ← 返回
        </Link>
        <span className="text-sm font-semibold text-primary-ink">🌱 SproutReader</span>
      </header>

      <h1 className="mt-5 text-2xl font-bold text-ink">{child.nickname} 的徽章墙</h1>
      <p className="mt-1 text-sm text-muted">
        已点亮 <span className="font-bold text-primary-ink">{earnedCount}</span> / {BADGE_TOTAL} 枚
        · 继续阅读点亮更多 🌱
      </p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-primary-soft">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat} className="mt-7">
          <h2 className="text-sm font-bold text-muted">{cat}</h2>
          <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5">
            {BADGES.filter((b) => b.category === cat).map((b) => {
              const isEarned = earned.has(b.key);
              const pr = b.progress(stats);
              return (
                <div key={b.key} className="flex flex-col items-center text-center">
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                      isEarned ? "bg-primary-soft shadow-card" : "bg-card opacity-45 grayscale"
                    }`}
                  >
                    {b.icon}
                  </span>
                  <p className={`mt-1.5 text-xs font-bold ${isEarned ? "text-ink" : "text-faint"}`}>
                    {b.name}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-faint">{b.desc}</p>
                  {!isEarned && pr.target > 1 && (
                    <span className="mt-1 rounded-full bg-secondary-soft px-1.5 text-[10px] font-semibold text-secondary-ink">
                      {pr.cur}/{pr.target}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="mt-8 text-center text-xs text-faint">徽章只会点亮、永不熄灭 ✨</p>
    </main>
  );
}
