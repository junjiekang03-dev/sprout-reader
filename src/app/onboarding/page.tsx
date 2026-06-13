"use client";

import { useActionState, useState } from "react";
import { createChild } from "@/app/actions/auth";
import { INTERESTS } from "@/lib/levels";

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createChild, null);
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold">为孩子建一个阅读档案</h1>
      <p className="mt-2 text-sm text-stone-500">
        填英文名或昵称就好,<b>不要用真实姓名</b>。这个名字会出现在每个故事里,孩子就是主角!
      </p>
      <form action={action} className="mt-8 space-y-6">
        <input
          name="nickname"
          placeholder="孩子的英文名,如 Leo / Mia"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg outline-amber-400"
          required
        />

        <div>
          <p className="mb-3 font-bold">孩子喜欢什么?(可多选)</p>
          <div className="grid grid-cols-2 gap-3">
            {INTERESTS.map((it) => {
              const on = picked.includes(it.key);
              return (
                <button
                  type="button"
                  key={it.key}
                  onClick={() => toggle(it.key)}
                  className={`rounded-2xl border-2 px-4 py-4 text-left text-lg transition active:scale-95 ${
                    on ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"
                  }`}
                >
                  <span className="text-2xl">{it.emoji}</span>
                  <span className="ml-2">{it.label}</span>
                </button>
              );
            })}
          </div>
          {picked.map((k) => (
            <input key={k} type="hidden" name="interests" value={k} />
          ))}
        </div>

        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow active:scale-95 disabled:opacity-50"
        >
          {pending ? "创建中..." : "下一步:测一测阅读级别"}
        </button>
      </form>
    </main>
  );
}
