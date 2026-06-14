import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getWeeklyReport, getStreak, getCalendar } from "@/lib/stats";
import { getLevel } from "@/lib/levels";

/**
 * 家长周报(可分享页面)
 * 通过不可猜测的 childId(cuid)访问,无需登录,方便转发给另一位家长/祖辈。
 * 页面只展示孩子昵称与学习统计,不含任何个人身份信息。
 * 二期:接微信服务号模板消息,每周日晚自动推送本页链接。
 */
export default async function ReportPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) notFound();

  const [report, streak, calendar] = await Promise.all([
    getWeeklyReport(child.id),
    getStreak(child.id),
    getCalendar(child.id, 28),
  ]);
  const level = getLevel(child.levelId);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <header className="text-center">
        <p className="text-sm font-semibold text-primary-ink">🌱 芽芽阅读 · 家长周报</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">{child.nickname} 的英语成长报告</h1>
        <p className="mt-1 text-xs text-faint">
          {report.weekStart} ~ {report.weekEnd}
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3">
        <ReportStat
          icon="📚"
          tint="primary"
          value={`${report.storiesRead}`}
          label="本周读完的故事"
        />
        <ReportStat icon="🔥" tint="accent" value={`${report.daysActive}/7`} label="坚持的天数" />
        <ReportStat
          icon="✍️"
          tint="secondary"
          value={`${report.wordsRead}`}
          label="英文阅读量(词)"
        />
        <ReportStat
          icon="🎯"
          tint="primary"
          value={`${Math.round(report.correctRate * 100)}%`}
          label="读后理解正确率"
        />
      </section>

      <section className="mt-4 rounded-card bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">当前阅读级别</p>
            <p className="mt-1 font-bold text-ink">
              {level.name} <span className="text-faint">L{level.id}</span>
            </p>
            <p className="mt-1 text-xs text-faint">
              {level.cefr} · 约{level.oxford} · {level.gradeLabel}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl">🔥</div>
            <p className="text-sm font-bold text-accent-ink">连续 {streak} 天</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {calendar.map((c) => (
            <div
              key={c.dateKey}
              className={`aspect-square rounded-md ${
                c.count >= 2 ? "bg-primary" : c.count === 1 ? "bg-primary/40" : "bg-line"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-card bg-primary-soft p-5 text-sm leading-relaxed text-primary-ink">
        {report.daysActive >= 4 ? (
          <>
            👏 本周坚持了 {report.daysActive} 天!语言习得靠的就是这种持续的「可理解输入」——
            每天读一点,比周末突击一小时有效得多。继续保持!
          </>
        ) : report.storiesRead > 0 ? (
          <>
            🌱 本周读了 {report.storiesRead} 篇,是个好开始。试试固定在每天同一时间 (比如睡前 15
            分钟)打开故事,更容易养成习惯。
          </>
        ) : (
          <>😴 本周还没有开始阅读。挑一个孩子喜欢的主题故事一起读 10 分钟, 是最好的重启方式。</>
        )}
      </section>

      <footer className="mt-10 text-center">
        <p className="text-xs text-faint">
          芽芽阅读 · 像母语者一样习得英语
          <br />
          15 级分级阅读 + 兴趣定制故事 + 地道朗读
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-white shadow-sm"
        >
          也想让我家孩子试试 →
        </Link>
      </footer>
    </main>
  );
}

/** 周报统计小卡:图标 + 数值 + 标签 */
function ReportStat({
  icon,
  tint,
  value,
  label,
}: {
  icon: string;
  tint: "primary" | "secondary" | "accent";
  value: string;
  label: string;
}) {
  const tintBg = {
    primary: "bg-primary-soft",
    secondary: "bg-secondary-soft",
    accent: "bg-accent-soft",
  }[tint];
  return (
    <div className="rounded-card bg-card p-4 text-center shadow-card">
      <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${tintBg}`}>
        {icon}
      </span>
      <p className="mt-1.5 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
