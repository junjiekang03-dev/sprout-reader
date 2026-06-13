import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionParent } from "@/lib/session";
import { recommendStory } from "@/lib/recommend";
import { getStreak, getCalendar, getLevelSuggestion } from "@/lib/stats";
import { getDueCount } from "@/lib/wordbook";
import { getLevel, INTERESTS } from "@/lib/levels";
import { dateKeyOf, renderWithName } from "@/lib/story-types";
import { logout } from "@/app/actions/auth";
import { LevelSuggestionBanner } from "./suggestion-banner";

export default async function HomePage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = parent.children[0];
  if (!child) redirect("/onboarding");
  if (!child.placementDone) redirect("/placement");

  const [story, streak, calendar, suggestion, dueCount] = await Promise.all([
    recommendStory(child.id),
    getStreak(child.id),
    getCalendar(child.id, 28),
    getLevelSuggestion(child.id, child.levelId),
    getDueCount(child.id),
  ]);
  const level = getLevel(child.levelId);
  const todayDone = calendar.find((c) => c.dateKey === dateKeyOf(new Date()))?.count ?? 0;

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hi, {child.nickname}! 👋</h1>
          <p className="mt-1 text-sm text-stone-500">
            {level.name} · {level.cefr} · 约{level.oxford} · {level.gradeLabel}
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl">🔥</div>
          <div className="text-sm font-bold text-amber-600">{streak} 天</div>
        </div>
      </header>

      {/* 升降级建议 */}
      {suggestion && (
        <LevelSuggestionBanner
          direction={suggestion.direction}
          toLevel={suggestion.toLevel}
          toLevelName={getLevel(suggestion.toLevel).name}
        />
      )}

      {/* 今日故事 */}
      <section className="mt-8">
        {story ? (
          <Link
            href={`/read/${story.id}`}
            className="block rounded-3xl bg-gradient-to-br from-amber-400 to-orange-400 p-6 text-white shadow-lg active:scale-95"
          >
            <p className="text-sm opacity-90">
              {todayDone > 0 ? "再读一篇 · " : "今日故事 · "}
              {INTERESTS.find((i) => i.key === story.interest)?.emoji}{" "}
              {INTERESTS.find((i) => i.key === story.interest)?.label}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {renderWithName(story.title, child.nickname)}
            </h2>
            <p className="mt-1 text-sm opacity-90">
              {story.wordCount} 词 · 主角是 {child.nickname} 自己!
            </p>
            <p className="mt-4 inline-block rounded-full bg-white/25 px-4 py-2 font-bold">
              {todayDone > 0 ? "继续阅读 →" : "开始阅读 →"}
            </p>
          </Link>
        ) : (
          <div className="rounded-3xl bg-white p-6 text-center text-stone-500 shadow-sm">
            🎉 这个级别的故事都读完啦!新故事每周上新,明天再来看看吧。
          </div>
        )}
      </section>

      {/* 复习生词(独立入口,不打断每日阅读主线;有到期词才显示) */}
      {dueCount > 0 && (
        <Link
          href="/review"
          className="mt-4 flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm active:scale-95"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <p className="font-bold">复习生词</p>
              <p className="text-xs text-stone-400">读过、查过的词,趁热复习更记得牢</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-white">
            {dueCount} 个待复习
          </span>
        </Link>
      )}

      {/* 打卡日历 */}
      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold">最近四周</h3>
          <span className="text-xs text-stone-400">读 1 篇就算打卡 ✓</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {calendar.map((c) => (
            <div
              key={c.dateKey}
              title={c.dateKey}
              className={`aspect-square rounded-md ${
                c.count >= 2 ? "bg-amber-500" : c.count === 1 ? "bg-amber-300" : "bg-stone-100"
              }`}
            />
          ))}
        </div>
      </section>

      {/* 家长入口 */}
      <section className="mt-6 flex gap-3">
        <Link
          href={`/report/${child.id}`}
          className="flex-1 rounded-2xl border border-stone-200 bg-white py-3 text-center text-sm text-stone-600 active:scale-95"
        >
          📈 家长周报
        </Link>
        <form action={logout} className="flex-1">
          <button className="w-full rounded-2xl border border-stone-200 bg-white py-3 text-center text-sm text-stone-400 active:scale-95">
            退出登录
          </button>
        </form>
      </section>

      <p className="mt-8 text-center text-xs text-stone-300">
        芽芽阅读会在连续使用 20 分钟时提醒孩子休息眼睛
      </p>
    </main>
  );
}
