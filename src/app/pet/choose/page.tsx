import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { getPet } from "@/lib/pet-store";
import { SPECIES, petImage } from "@/lib/pet";
import { choosePetAction } from "@/app/actions/pet";

export default async function ChoosePetPage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");
  if (await getPet(child.id)) redirect("/pet"); // 已有萌宠则直接进萌宠页

  return (
    <main className="mx-auto max-w-md px-5 pb-12 pt-8">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-sm text-faint">
          ← 返回
        </Link>
        <span className="text-sm font-semibold text-primary-ink">🌱 SproutReader</span>
      </header>

      <h1 className="mt-5 text-center text-2xl font-bold text-ink">选择你的神奇萌宠</h1>
      <p className="mt-2 text-center text-sm text-muted">
        它会陪 {child.nickname} 一起阅读、一起长大 🌱
      </p>

      <div className="mt-7 space-y-4">
        {SPECIES.map((s) => (
          <form
            key={s.key}
            action={choosePetAction}
            className="rounded-card bg-card p-4 shadow-card"
          >
            <input type="hidden" name="species" value={s.key} />
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={petImage(s.key, 0)}
                alt={s.name}
                className="h-20 w-20 shrink-0 rounded-full bg-primary-soft object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">
                  {s.name} <span className="text-xs font-normal text-muted">{s.element}</span>
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted">{s.blurb}</p>
              </div>
            </div>
            <button className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition active:scale-[0.98]">
              选「{s.name}」
            </button>
          </form>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-faint">读得越多,萌宠长得越大 ✨</p>
    </main>
  );
}
