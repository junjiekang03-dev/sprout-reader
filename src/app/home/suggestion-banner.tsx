"use client";

import { useState, useTransition } from "react";
import { acceptLevelSuggestion } from "@/app/actions/progression";

export function LevelSuggestionBanner({
  direction,
  toLevel,
  toLevelName,
}: {
  direction: "up" | "down";
  toLevel: number;
  toLevelName: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  if (dismissed) return null;

  const isUp = direction === "up";
  return (
    <div
      className={`mt-6 rounded-card p-5 ${
        isUp ? "bg-primary-soft text-primary-ink" : "bg-secondary-soft text-secondary-ink"
      }`}
    >
      <p className="font-bold">{isUp ? "🎉 准备好挑战更难一点了吗?" : "🌱 换个更舒服的难度?"}</p>
      <p className="mt-1 text-sm">
        {isUp
          ? `最近几篇读得又快又准,可以升到「${toLevelName}」试试更丰富的故事啦。`
          : `最近的故事有点吃力,回到「${toLevelName}」会读得更轻松、更有成就感。`}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          disabled={pending}
          onClick={() => startTransition(() => acceptLevelSuggestion(toLevel))}
          className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-50 ${
            isUp ? "bg-primary" : "bg-secondary"
          }`}
        >
          {pending ? "调整中..." : isUp ? `升到 ${toLevelName}` : `回到 ${toLevelName}`}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg px-5 py-2.5 text-sm text-muted active:scale-95"
        >
          先保持现在的
        </button>
      </div>
    </div>
  );
}
