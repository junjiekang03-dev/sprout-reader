"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Word {
  word: string;
  zh: string;
}

const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);
/** 词池不足时的备用干扰释义 */
const FALLBACK_ZH = ["快乐的", "朋友", "大大的", "一起", "美丽的", "勇敢的", "明亮的"];

export function ReviewSession({ words }: { words: Word[] }) {
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const total = words.length;
  const current = idx < total ? words[idx] : null;

  // 选项:正确释义 + 3 个干扰(来自其他生词,不够则用备用池),乱序
  const options = useMemo(() => {
    if (!current) return [];
    const others = words.filter((w) => w.zh !== current.zh).map((w) => w.zh);
    const distractors = shuffle([...new Set(others)]).slice(0, 3);
    for (const f of FALLBACK_ZH) {
      if (distractors.length >= 3) break;
      if (f !== current.zh && !distractors.includes(f)) distractors.push(f);
    }
    return shuffle([current.zh, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function pick(zh: string) {
    if (picked !== null || !current) return;
    const correct = zh === current.zh;
    setPicked(zh);
    if (correct) setCorrectCount((c) => c + 1);
    fetch("/api/wordbook/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: current.word, correct }),
    }).catch(() => {});
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 850);
  }

  /* ---------- 无待复习 ---------- */
  if (total === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl">🌳</div>
        <h1 className="mt-4 text-2xl font-bold">今天没有要复习的生词</h1>
        <p className="mt-2 text-muted">读故事时点不认识的词,它们会进生词本,到点再来复习。</p>
        <Link
          href="/home"
          className="mt-8 rounded-xl bg-primary px-8 py-3 font-bold text-white active:scale-[0.98]"
        >
          去读故事
        </Link>
      </main>
    );
  }

  /* ---------- 完成 ---------- */
  if (!current) {
    const allRight = correctCount === total;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl">{allRight ? "🏆" : "🌟"}</div>
        <h1 className="mt-4 text-2xl font-bold">复习完成!</h1>
        <p className="mt-2 text-muted">
          复习了 {total} 个词,答对 {correctCount} 个
        </p>
        <p className="mt-3 text-sm text-faint">答对的词,下次复习会隔得更久;答错的,明天再练。</p>
        <Link
          href="/home"
          className="mt-8 rounded-xl bg-primary px-8 py-3 font-bold text-white active:scale-[0.98]"
        >
          回到主页
        </Link>
      </main>
    );
  }

  /* ---------- 答题 ---------- */
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-soft">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-muted">
          {idx + 1}/{total}
        </span>
      </div>

      <div className="mt-10 flex-1">
        <p className="text-center text-sm text-faint">这个词是什么意思?</p>
        <p className="mt-3 text-center text-4xl font-bold">{current.word}</p>
        <div className="mt-10 space-y-3">
          {options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === current.zh;
            const showState = picked !== null;
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={showState}
                className={`w-full rounded-xl border-2 px-5 py-4 text-left text-lg transition active:scale-[0.98] ${
                  showState && isAnswer
                    ? "border-primary bg-primary-soft"
                    : showState && isPicked
                      ? "border-red-300 bg-red-50"
                      : "border-line bg-card active:border-primary"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-faint">答错也没关系,明天再见到它就记住了</p>
    </main>
  );
}
