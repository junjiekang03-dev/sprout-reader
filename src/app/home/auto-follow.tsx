"use client";

import { useState, useTransition } from "react";
import { setAutoFollowLevel, undoLevelChange } from "@/app/actions/progression";

/** 「自动跟随难度」开关(BACKLOG#3) */
export function AutoFollowToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(() => setAutoFollowLevel(next));
      }}
      disabled={pending}
      aria-pressed={on}
      className="flex w-full items-center justify-between rounded-card bg-card p-5 text-left shadow-card active:scale-[0.98] disabled:opacity-60"
    >
      <span>
        <span className="font-semibold text-ink">自动跟随难度</span>
        <span className="mt-0.5 block text-xs text-faint">
          读得好自动升、吃力自动降一级,每次变动都可撤销
        </span>
      </span>
      <span
        className={`relative ml-4 h-7 w-12 shrink-0 rounded-full transition-colors ${
          on ? "bg-primary" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all ${
            on ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

/** 最近一次自动调级的通知 + 撤销(BACKLOG#3) */
export function AutoChangeNotice({
  changeId,
  direction,
  toLevelName,
  childName,
}: {
  changeId: string;
  direction: string;
  toLevelName: string;
  childName: string;
}) {
  const [undone, setUndone] = useState(false);
  const [pending, startTransition] = useTransition();
  if (undone) return null;

  const isUp = direction === "up";
  return (
    <div
      className={`mt-6 rounded-card p-5 ${
        isUp ? "bg-primary-soft text-primary-ink" : "bg-secondary-soft text-secondary-ink"
      }`}
    >
      <p className="font-bold">{isUp ? "🎉 自动升级啦!" : "🌱 自动调整了难度"}</p>
      <p className="mt-1 text-sm">
        {childName} 最近{isUp ? "读得又快又准" : "读得有点吃力"},已自动{isUp ? "升" : "回"}到「
        {toLevelName}」。
      </p>
      <button
        onClick={() => {
          setUndone(true);
          startTransition(() => undoLevelChange(changeId));
        }}
        disabled={pending}
        className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-muted underline active:scale-95 disabled:opacity-50"
      >
        {pending ? "撤销中..." : "撤销这次调整"}
      </button>
    </div>
  );
}
