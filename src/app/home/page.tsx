import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { recommendStory } from "@/lib/recommend";
import { getStreak, getCalendar, getLevelSuggestion, getLatestAutoLevelChange } from "@/lib/stats";
import { getDueCount } from "@/lib/wordbook";
import { getEarnedBadges } from "@/lib/badges-store";
import { BADGE_TOTAL } from "@/lib/badges";
import { getPetState } from "@/lib/pet-store";
import { getLevel, INTERESTS } from "@/lib/levels";
import { dateKeyOf, renderWithName } from "@/lib/story-types";
import { logout } from "@/app/actions/auth";
import { LevelSuggestionBanner } from "./suggestion-banner";
import { AutoFollowToggle, AutoChangeNotice } from "./auto-follow";
import { ChildSwitcher } from "./child-switcher";

export default async function HomePage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");
  if (!child.placementDone) redirect("/placement");

  const [story, streak, calendar, suggestion, dueCount, latestChange, earnedBadges, petState] =
    await Promise.all([
      recommendStory(child.id),
      getStreak(child.id),
      getCalendar(child.id, 28),
      getLevelSuggestion(child.id, child.levelId),
      getDueCount(child.id),
      getLatestAutoLevelChange(child.id),
      getEarnedBadges(child.id),
      getPetState(child.id),
    ]);
  const earnedCount = earnedBadges.size;
  const level = getLevel(child.levelId);
  const todayDone = calendar.find((c) => c.dateKey === dateKeyOf(new Date()))?.count ?? 0;
  const activeDays = calendar.filter((c) => c.count > 0).length;
  const interest = INTERESTS.find((i) => i.key === story?.interest);

  return (
    <main className="mx-auto max-w-md px-5 pb-12 pt-6">
      {/* 品牌条 */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🌱</span>
        <span className="text-lg font-bold tracking-tight text-primary-ink">SproutReader</span>
      </div>

      {/* 问候 */}
      <header className="mt-5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Hi, {child.nickname}! 👋</h1>
        <p className="mt-1 text-sm text-muted">
          {level.name} · {level.cefr} · 约{level.oxford} · {level.gradeLabel}
        </p>
      </header>

      <ChildSwitcher
        kids={parent.children.map((c) => ({ id: c.id, nickname: c.nickname }))}
        activeId={child.id}
      />

      {/* 升降级:自动跟随开 → 显示最近自动调级 + 撤销;关 → 显示手动建议横幅 */}
      {child.autoFollowLevel
        ? latestChange && (
            <AutoChangeNotice
              changeId={latestChange.id}
              direction={latestChange.direction}
              toLevelName={getLevel(latestChange.toLevel).name}
              childName={child.nickname}
            />
          )
        : suggestion && (
            <LevelSuggestionBanner
              direction={suggestion.direction}
              toLevel={suggestion.toLevel}
              toLevelName={getLevel(suggestion.toLevel).name}
            />
          )}

      {/* 今日故事(Daily English Adventure) */}
      <section className="mt-7">
        {story ? (
          <Link
            href={`/read/${story.id}`}
            className="block rounded-card bg-secondary-soft p-5 shadow-card transition active:scale-[0.98]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-ink">
              {todayDone > 0 ? "再读一篇" : "今日故事"} · {interest?.emoji} {interest?.label}
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-ink">
              {renderWithName(story.title, child.nickname)}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {story.wordCount} 词 · 主角是 {child.nickname} 自己!
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm">
              {todayDone > 0 ? "继续阅读" : "开始阅读"} →
            </span>
          </Link>
        ) : (
          <div className="rounded-card bg-card p-6 text-center text-sm text-muted shadow-card">
            🎉 这个级别的故事都读完啦!新故事每周上新,明天再来看看吧。
          </div>
        )}
      </section>

      {/* 成长数据卡(真实指标) */}
      <section className="mt-4 grid grid-cols-3 gap-3">
        <StatCard icon="🔥" value={`${streak}`} label="连读天数" tint="accent" />
        <StatCard icon="🌱" value={`${activeDays}`} label="四周打卡" tint="primary" />
        <StatCard icon="✅" value={`${todayDone}`} label="今日已读" tint="secondary" />
      </section>

      {/* 萌宠养成 */}
      {petState ? (
        <Link
          href="/pet"
          className="mt-4 flex items-center gap-4 rounded-card bg-secondary-soft p-4 shadow-card transition active:scale-[0.98]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={petState.image}
            alt={petState.stageName}
            className="h-16 w-16 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{petState.stageName}</p>
            <p className="text-xs text-muted">
              {petState.progress.atMax
                ? "已长成成年形态 ✨"
                : `还差 ${petState.progress.toNext} 成长值进化`}
            </p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${petState.progress.pct}%` }}
              />
            </div>
          </div>
        </Link>
      ) : (
        <Link
          href="/pet/choose"
          className="mt-4 flex items-center justify-between rounded-card bg-secondary-soft p-4 shadow-card transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-2xl">
              🥚
            </span>
            <div>
              <p className="font-bold text-ink">领养你的神奇萌宠</p>
              <p className="text-xs text-muted">读书喂养,陪你一起长大</p>
            </div>
          </div>
          <span className="text-secondary-ink">→</span>
        </Link>
      )}

      {/* 复习生词(独立入口,不打断每日阅读主线;有到期词才显示) */}
      {dueCount > 0 && (
        <Link
          href="/review"
          className="mt-4 flex items-center justify-between rounded-card bg-card p-4 shadow-card transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-lg">
              📖
            </span>
            <div>
              <p className="font-semibold text-ink">复习生词</p>
              <p className="text-xs text-faint">读过、查过的词,趁热复习更记得牢</p>
            </div>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-white">
            {dueCount} 待复习
          </span>
        </Link>
      )}

      {/* 打卡日历 */}
      <section className="mt-4 rounded-card bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-ink">最近四周</h3>
          <span className="text-xs text-faint">读 1 篇就算打卡 ✓</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {calendar.map((c) => (
            <div
              key={c.dateKey}
              title={c.dateKey}
              className={`aspect-square rounded-md ${
                c.count >= 2 ? "bg-primary" : c.count === 1 ? "bg-primary/40" : "bg-line"
              }`}
            />
          ))}
        </div>
      </section>

      {/* 自动跟随难度开关 */}
      <section className="mt-4">
        <AutoFollowToggle enabled={child.autoFollowLevel} />
      </section>

      {/* 徽章墙入口 */}
      <Link
        href="/badges"
        className="mt-4 flex items-center justify-between rounded-card bg-card p-4 shadow-card transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg">
            🏅
          </span>
          <div>
            <p className="font-semibold text-ink">徽章墙</p>
            <p className="text-xs text-faint">读得越多,点亮越多</p>
          </div>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-ink">
          {earnedCount}/{BADGE_TOTAL}
        </span>
      </Link>

      {/* 家长入口 */}
      <section className="mt-4 flex gap-3">
        <Link
          href={`/report/${child.id}`}
          className="flex-1 rounded-lg border-2 border-secondary/30 bg-card py-3 text-center text-sm font-semibold text-secondary-ink transition active:scale-[0.98]"
        >
          📈 家长周报
        </Link>
        <form action={logout} className="flex-1">
          <button className="w-full rounded-lg border border-line bg-card py-3 text-center text-sm text-faint transition active:scale-[0.98]">
            退出登录
          </button>
        </form>
      </section>

      <p className="mt-8 text-center text-xs text-faint">
        芽芽阅读会在连续使用 20 分钟时提醒孩子休息眼睛
      </p>
    </main>
  );
}

/** 成长数据小卡(图标 + 数值 + 标签),tint 决定图标底色 */
function StatCard({
  icon,
  value,
  label,
  tint,
}: {
  icon: string;
  value: string;
  label: string;
  tint: "primary" | "secondary" | "accent";
}) {
  const tintBg = {
    primary: "bg-primary-soft",
    secondary: "bg-secondary-soft",
    accent: "bg-accent-soft",
  }[tint];
  return (
    <div className="rounded-card bg-card p-3 text-center shadow-card">
      <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${tintBg}`}>
        {icon}
      </span>
      <p className="mt-1.5 text-xl font-bold text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
