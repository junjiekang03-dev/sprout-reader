import { describe, it, expect } from "vitest";
import { scheduleNext, isDue, dueDateAfter } from "../srs";

describe("Leitner 间隔重复调度 scheduleNext", () => {
  it("答对:盒子 +1,间隔变长", () => {
    expect(scheduleNext(1, true)).toEqual({ box: 2, intervalDays: 2 });
    expect(scheduleNext(3, true)).toEqual({ box: 4, intervalDays: 7 });
  });

  it("答错:回到 box 1,间隔重置为 1 天", () => {
    expect(scheduleNext(4, false)).toEqual({ box: 1, intervalDays: 1 });
  });

  it("box 5 答对:封顶在 5,间隔最长", () => {
    expect(scheduleNext(5, true)).toEqual({ box: 5, intervalDays: 15 });
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
