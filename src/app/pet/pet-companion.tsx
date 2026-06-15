"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 点击萌宠时轮流冒出的鼓励语(只鼓励、不卖惨;轻轻指向真实的「读」) */
const CHEERS = [
  "再读一篇,我会更有精神!",
  "今天的你超棒 🌟",
  "我们一起加油!",
  "下一个故事在等我们啦~",
  "谢谢你陪我长大 🌱",
  "你越读,我越神气!",
];

const PARTICLES = ["💚", "✨", "⭐", "🌟", "💫"];

interface Burst {
  id: number;
  emoji: string;
  left: number; // 0-100 (%)
  delay: number; // ms
}

/**
 * 会动、能摸的萌宠:静止时轻轻漂浮,点一下蹦一下 + 冒爱心/星星 + 鼓励气泡。
 * 纯展示交互,不发放任何成长值(成长只挂真实学习)。
 */
export function PetCompanion({
  image,
  name,
  element,
}: {
  image: string;
  name: string;
  element?: string;
}) {
  const [popping, setPopping] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seq = useRef(0);
  const cheerIdx = useRef(0);

  // 卸载时清掉所有计时器,避免 setState-after-unmount / 内存泄漏
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  // 兴趣元素 emoji(如 "🌱 大地" → "🌱")也加入粒子池
  const elementEmoji = element?.match(/\p{Emoji}/u)?.[0];
  const pool = elementEmoji ? [elementEmoji, ...PARTICLES] : PARTICLES;

  const pat = useCallback(() => {
    // 蹦一下(重复点会续上)
    setPopping(true);
    later(620, () => setPopping(false));

    // 鼓励气泡(轮换)
    setBubble(CHEERS[cheerIdx.current % CHEERS.length]);
    cheerIdx.current += 1;
    later(1800, () => setBubble(null));

    // 冒一簇粒子
    const burst: Burst[] = Array.from({ length: 5 }, () => ({
      id: seq.current++,
      emoji: pool[Math.floor(Math.random() * pool.length)],
      left: 18 + Math.random() * 64,
      delay: Math.round(Math.random() * 160),
    }));
    setBursts((b) => [...b, ...burst]);
    const ids = new Set(burst.map((x) => x.id));
    later(1300, () => setBursts((b) => b.filter((x) => !ids.has(x.id))));
  }, [later, pool]);

  return (
    <div className="relative mx-auto h-44 w-44">
      {/* 鼓励气泡(视觉装饰,aria-hidden;读屏由下方常驻 live region 播报) */}
      {bubble && (
        <div
          aria-hidden
          className="pet-bubble pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-card"
        >
          {bubble}
        </div>
      )}
      {/* 常驻无障碍 live region:点萌宠时把鼓励语播报给读屏用户 */}
      <p role="status" aria-live="polite" className="sr-only">
        {bubble}
      </p>

      {/* 上升粒子 */}
      {bursts.map((p) => (
        <span
          key={p.id}
          className="pet-particle pointer-events-none absolute bottom-10 z-10 text-xl"
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}ms` }}
          aria-hidden
        >
          {p.emoji}
        </span>
      ))}

      {/* 萌宠本体(可点) */}
      <button
        type="button"
        onClick={pat}
        aria-label={`摸摸${name}`}
        className="block h-full w-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
      >
        <span className="pet-idle block h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden
            draggable={false}
            className={`h-full w-full select-none object-contain ${popping ? "pet-pop" : ""}`}
          />
        </span>
      </button>
    </div>
  );
}
