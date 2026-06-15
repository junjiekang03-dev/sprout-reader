import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { getPetState } from "@/lib/pet-store";
import { MAX_STAGE } from "@/lib/pet";
import { PetCompanion } from "./pet-companion";

export default async function PetPage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  const state = await getPetState(child.id);
  if (!state) redirect("/pet/choose"); // 还没领养

  const { species, stage, stageName, image, score, progress } = state;

  return (
    <main className="mx-auto max-w-md px-5 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-sm text-faint">
          ← 返回
        </Link>
        <span className="text-sm font-semibold text-primary-ink">🌱 SproutReader</span>
      </header>

      {/* 萌宠展示(真 3D:可拖转 / 点击互动) */}
      <section className="mt-6 rounded-card bg-secondary-soft p-4 text-center shadow-card">
        <PetCompanion image={image} name={stageName} species={species.key} />
        <p className="mt-1 text-xl font-bold text-ink">{stageName}</p>
        <p className="mt-0.5 text-xs text-muted">
          {species.element} · 成长阶段 {stage + 1}/{MAX_STAGE + 1}
        </p>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-secondary-ink">成长值 {score}</span>
            <span className="text-muted">
              {progress.atMax ? "已长成成年形态 ✨" : `还差 ${progress.toNext} 进化`}
            </span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* 怎么让它长大 */}
      <section className="mt-4 rounded-card bg-card p-5 shadow-card">
        <p className="font-semibold text-ink">读书,就能喂养它 🌱</p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>📖 读完一篇故事 · +10 成长值</li>
          <li>⭐ 读后答题全对 · +8 成长值</li>
          <li>🎯 牢记一个生词(复习出师)· +6 成长值</li>
          <li>🔥 每天坚持阅读 · +3 成长值</li>
        </ul>
        <p className="mt-3 text-xs text-faint">
          成长值由真实学习积累,萌宠只会长大、不会饿、不会走 💚
        </p>
      </section>

      <Link
        href="/home"
        className="mt-5 block rounded-xl bg-primary py-4 text-center text-lg font-bold text-white shadow-card transition active:scale-[0.98]"
      >
        去读一篇,喂养它 →
      </Link>
    </main>
  );
}
