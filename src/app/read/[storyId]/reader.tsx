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
  interest: string;
  slug: string;
}

const EYE_REST_MS = 20 * 60 * 1000; // 20 分钟护眼提醒

export function Reader(props: Props) {
  const [mode, setMode] = useState<"read" | "quiz" | "done">("read");
  const [popup, setPopup] = useState<{ word: string; zh: string | null } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{
    correct: number;
    total: number;
    streak: number;
    newBadges?: { key: string; name: string; icon: string }[];
    petEvolved?: { species: string; stage: number; name: string; image: string } | null;
  } | null>(null);
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
        <h1 className="mt-4 text-2xl font-bold text-ink">
          {allRight ? "太棒了!" : "读完啦,继续加油!"}
        </h1>
        <p className="mt-2 text-muted">
          答对 {result.correct}/{result.total} 题
        </p>
        <div className="mt-6 w-full rounded-card bg-card p-6 shadow-card">
          <p className="text-sm text-muted">连续阅读</p>
          <p className="mt-1 text-4xl font-bold text-accent">🔥 {result.streak} 天</p>
          <p className="mt-3 text-xs text-faint">{props.childName} 又离「用英语想事情」近了一步</p>
        </div>

        {result.petEvolved && (
          <div className="mt-4 w-full rounded-card bg-primary-soft p-5 text-center shadow-card">
            <p className="text-sm font-bold text-primary-ink">🎉 你的萌宠进化了!</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.petEvolved.image}
              alt={result.petEvolved.name}
              className="mx-auto mt-2 h-28 w-28 object-contain"
            />
            <p className="mt-1 text-base font-bold text-ink">进化成「{result.petEvolved.name}」</p>
            <Link
              href="/pet"
              className="mt-2 inline-block text-xs font-semibold text-primary-ink underline active:scale-[0.98]"
            >
              去萌宠页看看 →
            </Link>
          </div>
        )}

        {result.newBadges && result.newBadges.length > 0 && (
          <div className="mt-4 w-full rounded-card bg-accent-soft p-5 shadow-card">
            <p className="text-sm font-bold text-accent-ink">🎉 解锁了新徽章!</p>
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              {result.newBadges.map((b) => (
                <div key={b.key} className="flex flex-col items-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-2xl shadow-card">
                    {b.icon}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-accent-ink">{b.name}</span>
                </div>
              ))}
            </div>
            <Link
              href="/badges"
              className="mt-3 block text-center text-xs font-semibold text-accent-ink underline active:scale-[0.98]"
            >
              在徽章墙查看全部 →
            </Link>
          </div>
        )}

        <div className="mt-8 flex w-full gap-3">
          <Link
            href="/home"
            className="flex-1 rounded-xl bg-primary py-4 font-bold text-white shadow-sm active:scale-[0.98]"
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
        <p className="text-sm text-muted">
          读懂了吗?第 {qIndex + 1}/{props.questions.length} 题
        </p>
        <h2 className="mt-4 text-xl leading-relaxed font-semibold text-ink">{q.prompt}</h2>
        <div className="mt-8 space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => pickAnswer(opt.value)}
              className="w-full rounded-xl border-2 border-line bg-card px-5 py-4 text-left text-lg text-ink shadow-card transition active:scale-[0.98] active:border-primary"
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
    <main className="mx-auto max-w-md px-6 py-8 pb-32 md:max-w-5xl">
      <header className="flex items-center justify-between">
        <Link href="/home" className="text-sm text-faint">
          ← 返回
        </Link>
        <button
          onClick={toggleAudio}
          className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
            playing ? "bg-secondary text-white" : "bg-secondary-soft text-secondary-ink"
          }`}
        >
          {playing ? "⏸ 暂停朗读" : "🎧 听老师读"}
        </button>
      </header>
      {props.audioUrl && (
        <audio ref={audioRef} src={props.audioUrl} onEnded={() => setPlaying(false)} />
      )}

      {/* 左图右文(宽屏两栏 / 窄屏图在上) */}
      <div className="md:flex md:items-start md:gap-10">
        {/* 故事插画:按篇取图,缺图回退到本轨道插画 */}
        <figure className="mt-5 md:sticky md:top-6 md:mt-1 md:w-2/5 md:shrink-0">
          <div className="overflow-hidden rounded-card bg-secondary-soft shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/illustrations/stories/${props.slug}.jpg`}
              alt={`${props.title} 故事插画`}
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fb) {
                  img.dataset.fb = "1";
                  img.src = `/illustrations/${props.interest}.svg`;
                }
              }}
              className="block aspect-square w-full object-cover"
            />
          </div>
        </figure>

        {/* 正文 */}
        <div className="md:min-w-0 md:flex-1">
          <h1 className="mt-6 text-2xl font-bold text-ink md:mt-1">{props.title}</h1>
          <p className="mt-1 text-xs text-faint">看不懂的单词,点一下试试 👆</p>

          <article className="mt-6 font-serif text-[1.3rem] leading-[1.9] text-ink">
            {props.text.split(/\s+/).map((token, i) => (
              <span key={i}>
                <button
                  onClick={() => lookup(token)}
                  className="rounded px-0.5 active:bg-accent-soft"
                >
                  {token}
                </button>{" "}
              </span>
            ))}
          </article>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-background via-background to-transparent p-6 md:max-w-5xl md:px-8">
        <button
          onClick={() => {
            window.speechSynthesis?.cancel();
            setMode("quiz");
          }}
          className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-hover active:scale-[0.98] md:mx-auto md:block md:max-w-sm"
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
          <div className="mb-28 w-[88%] max-w-sm rounded-card bg-card p-6 shadow-hover">
            <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
              生词
            </span>
            <p className="mt-2 text-2xl font-bold text-ink">{popup.word}</p>
            {popup.zh ? (
              <p className="mt-2 text-lg text-muted">{popup.zh}</p>
            ) : (
              <p className="mt-2 text-sm text-faint">
                这个词不难,先从故事里猜猜看?猜词也是母语者的本事 🙂
              </p>
            )}
          </div>
        </div>
      )}

      {/* 护眼提醒 */}
      {showRest && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-8">
          <div className="rounded-card bg-card p-8 text-center">
            <div className="text-5xl">🌳</div>
            <h2 className="mt-3 text-xl font-bold text-ink">休息一下眼睛吧</h2>
            <p className="mt-2 text-sm text-muted">
              已经读了 20 分钟啦,看看窗外远处的东西,20 秒后再回来。
            </p>
            <button
              onClick={() => setShowRest(false)}
              className="mt-6 rounded-xl bg-primary px-8 py-3 font-bold text-white active:scale-[0.98]"
            >
              好的,休息好了
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
