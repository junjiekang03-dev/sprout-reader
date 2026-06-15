import { describe, it, expect } from "vitest";
import {
  reviewCard,
  isMature,
  isDue,
  dueDateAfter,
  pickSession,
  INIT_EASE,
  MIN_EASE,
  MATURE_INTERVAL_DAYS,
  type CardState,
} from "../srs";

const newCard: CardState = { ease: INIT_EASE, reps: 0, intervalDays: 0 };

describe("SM-2 调度 reviewCard — 连续答对的间隔阶梯", () => {
  it("新词连续答对:间隔 1 → 6 → 15 → 38,reps 递增,识别题答对 ease 维持 2.5", () => {
    const s1 = reviewCard(newCard, "good");
    expect(s1).toEqual({ ease: 2.5, reps: 1, intervalDays: 1 });
    const s2 = reviewCard(s1, "good");
    expect(s2).toEqual({ ease: 2.5, reps: 2, intervalDays: 6 });
    const s3 = reviewCard(s2, "good");
    expect(s3).toEqual({ ease: 2.5, reps: 3, intervalDays: 15 }); // round(6 × 2.5)
    const s4 = reviewCard(s3, "good");
    expect(s4).toEqual({ ease: 2.5, reps: 4, intervalDays: 38 }); // round(15 × 2.5)
  });
});

describe("SM-2 调度 reviewCard — 答错(遗忘)", () => {
  it("答错:reps 归零、间隔回到 1 天、ease 永久 -0.32", () => {
    const mature: CardState = { ease: 2.5, reps: 3, intervalDays: 15 };
    expect(reviewCard(mature, "again")).toEqual({ ease: 2.18, reps: 0, intervalDays: 1 });
  });

  it("ease 下限 1.3:反复答错也不会更低", () => {
    let s: CardState = { ease: MIN_EASE, reps: 0, intervalDays: 1 };
    s = reviewCard(s, "again");
    expect(s.ease).toBe(MIN_EASE);
  });

  it("遗忘后 ease 降低 → 此后间隔涨得更慢(SM-2 的逐词自适应)", () => {
    // 满 ease(2.5)第三次答对间隔 15;降过 ease(2.18)同一步只到 13
    const lowEase: CardState = { ease: 2.18, reps: 2, intervalDays: 6 };
    expect(reviewCard(lowEase, "good").intervalDays).toBe(13); // round(6 × 2.18)
  });
});

describe("成熟卡判定 isMature(牢记口径)", () => {
  it("间隔 ≥ 21 天才算成熟", () => {
    expect(MATURE_INTERVAL_DAYS).toBe(21);
    expect(isMature(15)).toBe(false);
    expect(isMature(20)).toBe(false);
    expect(isMature(21)).toBe(true);
    expect(isMature(38)).toBe(true);
  });
});

describe("到期判断 isDue / dueDateAfter", () => {
  it("dueDate ≤ 今天 → 到期;晚于今天 → 未到期", () => {
    expect(isDue("2026-06-10", "2026-06-13")).toBe(true);
    expect(isDue("2026-06-13", "2026-06-13")).toBe(true);
    expect(isDue("2026-06-20", "2026-06-13")).toBe(false);
  });

  it("dueDateAfter:从今天 + 间隔天数算出下次复习日期键", () => {
    expect(dueDateAfter("2026-06-13", 2)).toBe("2026-06-15");
    // 跨月
    expect(dueDateAfter("2026-06-30", 2)).toBe("2026-07-02");
  });
});

describe("一轮复习挑卡 pickSession(新词不被生疏复习词饿死)", () => {
  const card = (id: string, intervalDays: number) => ({ id, intervalDays });
  const ids = (cards: { id: string }[]) => cards.map((c) => c.id);

  it("卡片不足 limit:全返回", () => {
    const due = [card("a", 0), card("b", 1), card("c", 5)];
    expect(ids(pickSession(due, 12))).toEqual(["a", "b", "c"]);
  });

  it("一堆生疏复习词 + 若干新词:仍保证 newPerSession 个新词进场", () => {
    // due 已按 ease 升序排:生疏复习词(interval>0)在前,新词(interval===0)在后
    const reviews = Array.from({ length: 10 }, (_, i) => card(`r${i}`, 1));
    const news = Array.from({ length: 5 }, (_, i) => card(`n${i}`, 0));
    const picked = pickSession([...reviews, ...news], 12, 4);
    expect(picked).toHaveLength(12);
    const newsIn = picked.filter((c) => c.intervalDays === 0);
    expect(newsIn).toHaveLength(4); // 不是 0(老 .slice 会把新词全切掉)
    expect(ids(newsIn)).toEqual(["n0", "n1", "n2", "n3"]);
  });

  it("新词多、复习少:复习词全进,空位用新词补满", () => {
    const reviews = [card("r0", 1), card("r1", 1)];
    const news = Array.from({ length: 20 }, (_, i) => card(`n${i}`, 0));
    const picked = pickSession([...reviews, ...news], 12, 4);
    expect(picked).toHaveLength(12);
    expect(picked.filter((c) => c.intervalDays > 0)).toHaveLength(2); // 2 张复习全进
    expect(picked.filter((c) => c.intervalDays === 0)).toHaveLength(10); // 其余 10 张新词
  });

  it("到期卡远超 limit:严格截到 limit", () => {
    const due = Array.from({ length: 50 }, (_, i) => card(`x${i}`, (i % 3) + 1));
    expect(pickSession(due, 12)).toHaveLength(12);
  });
});
