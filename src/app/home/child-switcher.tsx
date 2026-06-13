"use client";

import Link from "next/link";
import { useTransition } from "react";
import { switchChild } from "@/app/actions/auth";

/** 多孩子切换器(BACKLOG#4):点孩子名切换当前活跃孩子,＋号去新建 */
export function ChildSwitcher({
  kids,
  activeId,
}: {
  kids: { id: string; nickname: string }[];
  activeId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {kids.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            disabled={pending || active}
            onClick={() => startTransition(() => switchChild(c.id))}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition active:scale-95 ${
              active
                ? "bg-amber-500 text-white"
                : "bg-white text-stone-600 shadow-sm disabled:opacity-50"
            }`}
          >
            {c.nickname}
          </button>
        );
      })}
      <Link
        href="/onboarding"
        className="rounded-full border border-dashed border-stone-300 px-4 py-1.5 text-sm text-stone-400 active:scale-95"
      >
        ＋ 添加孩子
      </Link>
    </div>
  );
}
