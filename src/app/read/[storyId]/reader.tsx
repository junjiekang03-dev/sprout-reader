"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GlossaryEntry } from "@/lib/story-types";

interface Props {
  storyId: string;
  title: string;
  text: string;
  glossary: GlossaryEntry[];
  questions: { prompt: string; options: { text: string; value: number }[] }[];
  audioUrl: string | null;
  childName: string;
}

const EYE_REST_MS = 20 * 60 * 1000; // 20 分钟护眼提醒

export function Reader(props: Props) {
  const [mode, setMode] = useState<"read" | "quiz" | "done">("read");
  const [popup, setPopup] = useState<{ word: string; zh: string | null } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ correct: number; total: number; streak: number } | null>(
    null
  );
  const [showRest, setShowRest] = useState(false);
  const startedAt = useRef(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 护眼提醒
  useEffect(() => {
    const t = setTimeout(() => setShowRest(true), EYE_REST_MS);
    return () => clearTimeout(t);
  }, []);

  // 卸载时停掉 Web Speech
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggleAudio() {
    if (props.audioUrl) {
      const el = audioRef.current;
      if (!el) return;
      if (playing) el.pause();
      else el.play();
      setPlaying(!playing);
      return;
    }
    // 无预生成音频:回退浏览器 Web Speech(开发期/兜底)
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(props.text);
    u.lang = "en-US";
    u.rate = 0.85;
    const voice = synth.getVoices().find((v) => v.lang.startsWith("en"));
    if (voice) u.voice = voice;
    u.onend = () => setPlaying(false);
    synth.speak(u);
    setPlaying(true);
  }

  function lookup(rawWord: string) {
    const word = rawWord.replace(/[^a-zA-Z']/g, "");
    if (!word) return;
    const lower = word.toLowerCase().replace(/'s$/, "");
    const hit = props.glossary.find(
      (g) =>
        g.word.toLowerCase() === lower ||
        lower.startsWith(g.word.toLowerCase()) ||
        g.word.toLowerCase().startsWith(lower.slice(0, Math.max(3, lower.length - 2)))
    );
    setPopup({ word, zh: hit ? hit.zh : null });
    // 有释义的生词记入生词本(fire-and-forget,不阻塞查词体验)
    if (hit) {
      fetch("/api/wordbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: hit.word, zh: hit.zh }),
      }).catch(() => {});
    }
    // 朗读这个词
    const synth = window.speechSynthesis;
    if (synth && !playing) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "en-US";
      u.rate = 0.8;
      synth.speak(u);
    }
  }

  async function submitQuiz(finalAnswers: number[]) {
    const res = await fetch("/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: props.storyId,
        answers: finalAnswers,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      }),
    });
    const data = await res.json();
    setResult(data);
    setMode("done");
  }

  function pickAnswer(idx: number) {
    const next = [...answers, idx];
    setAnswers(next);
    if (qIndex + 1 >= props.questions.length) {
      submitQuiz(next);
    } else {
      setQIndex(qIndex + 1);
    }
  }

  /* ---------- 结果页 ---------- */
  if (mode === "done" && result) {
    const allRight = result.correct === result.total;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl">{allRight ? "🏆" : result.correct > 0 ? "🌟" : "🌱"}</div>
        <h1 className="mt-4 text-2xl font-bold">{allRight ? "太棒了!" : "读完啦,继续加油!"}</h1>
        <p className="mt-2 text-stone-600">
          答对 {result.correct}/{result.total} 题
        </p>
        <div className="mt-6 w-full rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-500">连续阅读</p>
          <p className="mt-1 text-4xl font-bold text-amber-500">🔥 {result.streak} 天</p>
          <p className="mt-3 text-xs text-stone-400">
            {props.childName} 又离「用英语想事情」近了一步
          </p>
        </div>
        <div className="mt-8 flex w-full gap-3">
          <Link
            href="/home"
            className="flex-1 rounded-2xl bg-amber-500 py-4 font-bold text-white active:scale-95"
          >
            回到主页
          </Link>
        </div>
      </main>
    );
  }

  /* ---------- 答题页 ---------- */
  if (mode === "quiz") {
    const q = props.questions[qIndex];
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
        <p className="text-sm text-stone-500">
          读懂了吗?第 {qIndex + 1}/{props.questions.length} 题
        </p>
        <h2 className="mt-4 text-xl leading-relaxed font-medium">{q.prompt}</h2>
        <div className="mt-8 space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => pickAnswer(opt.value)}
              className="w-full rounded-2xl border-2 border-stone-200 bg-white px-5 py-4 text-left text-lg active:scale-95 active:border-amber-400"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </main>
    );
  }

  /* ---------- 阅读页 ---------- */
  return (
    <main className="mx-auto max-w-md px-6 py-8 pb-32">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-stone-400">
          ← 返回
        </Link>
        <button
          onClick={toggleAudio}
          className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 active:scale-95"
        >
          {playing ? "⏸ 暂停朗读" : "🎧 听老师读"}
        </button>
      </header>
      {props.audioUrl && (
        <audio ref={audioRef} src={props.audioUrl} onEnded={() => setPlaying(false)} />
      )}

      <h1 className="mt-6 text-2xl font-bold">{props.title}</h1>
      <p className="mt-1 text-xs text-stone-400">看不懂的单词,点一下试试 👆</p>

      <article className="mt-6 text-[1.35rem] leading-loose tracking-wide">
        {props.text.split(/\s+/).map((token, i) => (
          <span key={i}>
            <button onClick={() => lookup(token)} className="rounded px-0.5 active:bg-amber-200">
              {token}
            </button>{" "}
          </span>
        ))}
      </article>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-[#fffbf2] via-[#fffbf2] to-transparent p-6">
        <button
          onClick={() => {
            window.speechSynthesis?.cancel();
            setMode("quiz");
          }}
          className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-bold text-white shadow-lg active:scale-95"
        >
          我读完了 →
        </button>
      </div>

      {/* 查词弹层 */}
      {popup && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/20"
          onClick={() => setPopup(null)}
        >
          <div className="mb-28 w-[88%] max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <p className="text-2xl font-bold">{popup.word}</p>
            {popup.zh ? (
              <p className="mt-2 text-lg text-stone-600">{popup.zh}</p>
            ) : (
              <p className="mt-2 text-sm text-stone-400">
                这个词不难,先从故事里猜猜看?猜词也是母语者的本事 🙂
              </p>
            )}
          </div>
        </div>
      )}

      {/* 护眼提醒 */}
      {showRest && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-8">
          <div className="rounded-3xl bg-white p-8 text-center">
            <div className="text-5xl">🌳</div>
            <h2 className="mt-3 text-xl font-bold">休息一下眼睛吧</h2>
            <p className="mt-2 text-sm text-stone-500">
              已经读了 20 分钟啦,看看窗外远处的东西,20 秒后再回来。
            </p>
            <button
              onClick={() => setShowRest(false)}
              className="mt-6 rounded-2xl bg-emerald-500 px-8 py-3 font-bold text-white active:scale-95"
            >
              好的,休息好了
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
