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
                ? "bg-primary text-white"
                : "bg-card text-muted shadow-card disabled:opacity-50"
            }`}
          >
            {c.nickname}
          </button>
        );
      })}
      <Link
        href="/onboarding"
        className="rounded-full border border-dashed border-line px-4 py-1.5 text-sm text-faint active:scale-95"
      >
        ＋ 添加孩子
      </Link>
    </div>
  );
}
