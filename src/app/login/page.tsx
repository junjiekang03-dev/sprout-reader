"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">欢迎回来 🌱</h1>
      <form action={action} className="mt-8 space-y-4">
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="家长手机号"
          className="w-full rounded-xl border border-line bg-card px-5 py-4 text-lg outline-secondary"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="密码"
          className="w-full rounded-xl border border-line bg-card px-5 py-4 text-lg outline-secondary"
          required
        />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-card active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        还没有账号?{" "}
        <Link href="/register" className="font-bold text-primary-ink">
          免费注册
        </Link>
      </p>
    </main>
  );
}
