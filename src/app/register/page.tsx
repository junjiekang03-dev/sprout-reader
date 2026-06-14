"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">家长注册</h1>
      <p className="mt-2 text-sm text-muted">
        芽芽阅读由家长创建账号,再为孩子建立阅读档案——我们不直接收集孩子的个人信息。
      </p>
      <form action={action} className="mt-8 space-y-4">
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="家长手机号"
          className="w-full rounded-xl border border-line bg-card px-5 py-4 text-lg focus:border-secondary"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="设置密码(至少 8 位)"
          className="w-full rounded-xl border border-line bg-card px-5 py-4 text-lg focus:border-secondary"
          required
        />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-card active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "注册中..." : "注册并开始"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        已有账号?{" "}
        <Link href="/login" className="font-bold text-primary-ink">
          去登录
        </Link>
      </p>
    </main>
  );
}
