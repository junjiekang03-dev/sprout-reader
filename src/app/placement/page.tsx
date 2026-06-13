"use client";

import { useMemo, useState, useTransition } from "react";
import { PLACEMENT_BANK, type PlacementItem } from "@/lib/placement-bank";
import { savePlacement } from "@/app/actions/placement";

const TOTAL = 8;
/** 阶梯步长:先大步定位,后小步微调 */
const STEPS = [3, 2, 2, 1, 1, 1, 1];

function pickItem(level: number, used: Set<PlacementItem>): PlacementItem {
  const clamped = Math.max(1, Math.min(12, level));
  // 当前级别没有未用题时,就近找
  for (let d = 0; d <= 11; d++) {
    for (const l of [clamped - d, clamped + d]) {
      const item = PLACEMENT_BANK.find((q) => q.level === l && !used.has(q));
      if (item) return item;
    }
  }
  return PLACEMENT_BANK[0];
}

export default function PlacementPage() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(3);
  const [used] = useState(() => new Set<PlacementItem>());
  const [history, setHistory] = useState<{ level: number; correct: boolean }[]>([]);
  const [pending, startTransition] = useTransition();

  const item = useMemo(() => {
    const it = pickItem(level, used);
    used.add(it);
    return it;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function answer(idx: number) {
    const correct = idx === item.answer;
    const nextHistory = [...history, { level: item.level, correct }];
    setHistory(nextHistory);

    if (step + 1 >= TOTAL) {
      // 最终级别 = 答对题目的最高级别与当前位置的折中,保守偏下(宁可读简单也别劝退)
      const correctLevels = nextHistory.filter((h) => h.correct).map((h) => h.level);
      const peak = correctLevels.length > 0 ? Math.max(...correctLevels) : 1;
      const final = Math.max(1, Math.min(12, Math.min(peak, correct ? level + 1 : level - 1)));
      startTransition(() => savePlacement(final));
      return;
    }

    const delta = STEPS[step] ?? 1;
    setLevel((l) => Math.max(1, Math.min(12, correct ? l + delta : l - delta)));
    setStep((s) => s + 1);
  }

  if (pending) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-xl">正在为孩子计算阅读级别... 🌱</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
        <span className="text-sm text-stone-500">
          {step + 1}/{TOTAL}
        </span>
      </div>

      <div className="mt-10 flex-1">
        <p className="text-xl leading-relaxed font-medium">{item.prompt}</p>
        <div className="mt-8 space-y-3">
          {item.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => answer(i)}
              className="w-full rounded-2xl border-2 border-stone-200 bg-white px-5 py-4 text-left text-lg transition active:scale-95 active:border-amber-400"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-stone-400">
        做错也没关系,我们只是在找最适合孩子的起点
      </p>
    </main>
  );
}
