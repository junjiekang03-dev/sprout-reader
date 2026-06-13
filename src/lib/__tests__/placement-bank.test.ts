import { describe, it, expect } from "vitest";
import { PLACEMENT_BANK } from "../placement-bank";

/**
 * 入级测评题库的结构不变量。
 * 这是题库的质量门禁:以后加题、改题都不能破坏这些约束。
 */
describe("入级测评题库 PLACEMENT_BANK", () => {
  it("L1-L12 每个级别至少有 4 道题", () => {
    for (let lv = 1; lv <= 12; lv++) {
      const count = PLACEMENT_BANK.filter((q) => q.level === lv).length;
      expect(count, `Level ${lv} 题数应 ≥4`).toBeGreaterThanOrEqual(4);
    }
  });

  it("每题有 3-4 个选项,答案下标合法,题干非空", () => {
    for (const q of PLACEMENT_BANK) {
      expect(q.options.length, `"${q.prompt}" 选项数`).toBeGreaterThanOrEqual(3);
      expect(q.options.length, `"${q.prompt}" 选项数`).toBeLessThanOrEqual(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it("同一级别内题干不重复", () => {
    for (let lv = 1; lv <= 12; lv++) {
      const prompts = PLACEMENT_BANK.filter((q) => q.level === lv).map((q) => q.prompt);
      expect(new Set(prompts).size, `Level ${lv} 有重复题干`).toBe(prompts.length);
    }
  });

  it("选项内部不重复", () => {
    for (const q of PLACEMENT_BANK) {
      expect(new Set(q.options).size, `"${q.prompt}" 有重复选项`).toBe(q.options.length);
    }
  });
});
