"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">家长注册</h1>
      <p className="mt-2 text-sm text-stone-500">
        芽芽阅读由家长创建账号,再为孩子建立阅读档案——我们不直接收集孩子的个人信息。
      </p>
      <form action={action} className="mt-8 space-y-4">
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="家长手机号"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg outline-amber-400"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="设置密码(至少 8 位)"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg outline-amber-400"
          required
        />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow active:scale-95 disabled:opacity-50"
        >
          {pending ? "注册中..." : "注册并开始"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        已有账号?{" "}
        <Link href="/login" className="font-bold text-amber-600">
          去登录
        </Link>
      </p>
    </main>
  );
}
