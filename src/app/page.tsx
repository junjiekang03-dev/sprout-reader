import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionParent } from "@/lib/session";

export default async function Landing() {
  const parent = await getSessionParent();
  if (parent) redirect(parent.children.length === 0 ? "/onboarding" : "/home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="text-center">
        <div className="text-6xl">🌱</div>
        <h1 className="mt-4 text-3xl font-bold">芽芽阅读</h1>
        <p className="mt-1 text-sm tracking-widest text-amber-600">SPROUT READER</p>
        <p className="mt-6 text-lg leading-relaxed text-stone-600">
          像母语者一样习得英语。
          <br />
          每天一个为孩子兴趣定制的英文故事,
          <br />
          读得懂、听得清、坚持得下去。
        </p>
      </div>

      <ul className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
        <li className="flex gap-3">
          <span>📚</span>
          <span>15 级自研分级,对标牛津树与校内年级</span>
        </li>
        <li className="flex gap-3">
          <span>🦖</span>
          <span>孩子选主题,主角就是 TA 自己</span>
        </li>
        <li className="flex gap-3">
          <span>🎧</span>
          <span>每篇配地道朗读,读+听双输入</span>
        </li>
        <li className="flex gap-3">
          <span>📈</span>
          <span>每周给家长一份看得懂的成长报告</span>
        </li>
      </ul>

      <div className="space-y-3">
        <Link
          href="/register"
          className="block rounded-2xl bg-amber-500 py-4 text-center text-lg font-bold text-white shadow active:scale-95"
        >
          免费开始(5 分钟测出阅读级别)
        </Link>
        <Link
          href="/login"
          className="block rounded-2xl border border-stone-200 bg-white py-4 text-center text-stone-600 active:scale-95"
        >
          已有账号,直接登录
        </Link>
      </div>

      <p className="text-center text-xs text-stone-400">
        家长注册 · 孩子档案仅需英文昵称 · 内置 20 分钟护眼提醒
      </p>
    </main>
  );
}
