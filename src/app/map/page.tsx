import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { getLevelMapData } from "@/lib/level-map-store";
import { getPetState } from "@/lib/pet-store";
import type { LevelNode } from "@/lib/level-map";

export default async function MapPage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");
  if (!child.placementDone) redirect("/placement");

  const [map, petState] = await Promise.all([
    getLevelMapData(child.id, child.levelId),
    getPetState(child.id),
  ]);

  const pct = Math.round((map.currentLevel / map.totalLevels) * 100);

  return (
    <main className="mx-auto max-w-md px-5 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-sm text-faint">
          ← 返回
        </Link>
        <span className="text-sm font-semibold text-primary-ink">🌱 SproutReader</span>
      </header>

      <h1 className="mt-5 text-2xl font-bold text-ink">{child.nickname} 的成长地图</h1>
      <p className="mt-1 text-sm text-muted">
        从 <b>种子</b> 一路读到 <b>星河</b> · 现在在第{" "}
        <span className="font-bold text-primary-ink">{map.currentLevel}</span> / {map.totalLevels}{" "}
        关{map.totalRead > 0 && ` · 累计读完 ${map.totalRead} 篇`}
      </p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-primary-soft">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 闯关路径:顶=L1 种子,底=L15 星河;走过的路绿色、前方灰色,萌宠站在「你在这里」 */}
      <ol className="mt-8">
        {map.nodes.map((node, i) => (
          <LevelRow
            key={node.level.id}
            node={node}
            isLast={i === map.nodes.length - 1}
            petImage={node.status === "current" ? petState?.image : undefined}
            petName={node.status === "current" ? petState?.stageName : undefined}
          />
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-faint">
        多读、答得棒,就会升到下一关 🌱 级别只看真实表现,只会前进、随时可在主页调整
      </p>
    </main>
  );
}

/** 一关:左侧节点圆 + 通向下一关的连接线,右侧级别信息。状态决定配色。 */
function LevelRow({
  node,
  isLast,
  petImage,
  petName,
}: {
  node: LevelNode;
  isLast: boolean;
  petImage?: string;
  petName?: string;
}) {
  const { level, status, readCount, storyCount } = node;
  // 本节点之后通向下一关的路:已通过的关之后是「走过的路」(绿),否则是「前方」(灰)
  const traveled = status === "cleared";

  const circle =
    status === "cleared"
      ? "bg-primary text-white shadow-card"
      : status === "current"
        ? "bg-accent text-white shadow-card ring-4 ring-accent-soft"
        : "bg-line text-faint";

  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className={`absolute left-[21px] top-11 h-full w-0.5 ${traveled ? "bg-primary" : "bg-line"}`}
        />
      )}

      <span
        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${circle}`}
      >
        {status === "cleared" ? "✓" : status === "locked" ? "🔒" : level.id}
      </span>

      {status === "current" ? (
        <div className="min-w-0 flex-1 rounded-card bg-accent-soft p-3 shadow-card">
          <div className="flex items-center gap-2">
            {petImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={petImage} alt={petName} className="h-9 w-9 shrink-0 object-contain" />
            )}
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
              你在这里
            </span>
          </div>
          <p className="mt-1.5 font-bold text-ink">{level.name}</p>
          <p className="text-xs text-muted">
            {level.cefr} · 约{level.oxford} · {level.gradeLabel}
          </p>
          {storyCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-accent-ink">
              本关读了 {readCount} / {storyCount} 篇
            </p>
          )}
        </div>
      ) : (
        <div className={`min-w-0 flex-1 pt-1.5 ${status === "locked" ? "opacity-60" : ""}`}>
          <p className={`font-semibold ${status === "cleared" ? "text-ink" : "text-faint"}`}>
            {level.name}
          </p>
          <p className="text-xs text-faint">
            {level.gradeLabel}
            {status === "cleared" && readCount > 0 && ` · 读过 ${readCount} 篇`}
          </p>
        </div>
      )}
    </li>
  );
}
