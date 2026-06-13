import { describe, it, expect } from "vitest";
import { suggestLevelChange } from "../progression";

describe("升降级建议 suggestLevelChange", () => {
  it("没有阅读记录时不给任何建议", () => {
    expect(suggestLevelChange({ currentLevel: 3, readings: [] })).toBeNull();
  });

  it("当前级别最近 5 篇平均正确率 ≥90% 时,建议升一级", () => {
    const readings = [
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
      { storyLevelId: 3, correctCount: 2, totalCount: 3 },
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
    ];
    expect(suggestLevelChange({ currentLevel: 3, readings })).toEqual({
      direction: "up",
      toLevel: 4,
    });
  });

  it("已在最高级别(15)时,即使全对也不建议升级", () => {
    const readings = Array.from({ length: 5 }, () => ({
      storyLevelId: 15,
      correctCount: 3,
      totalCount: 3,
    }));
    expect(suggestLevelChange({ currentLevel: 15, readings })).toBeNull();
  });

  it("当前级别最近 3 篇平均正确率 ≤40% 时,建议降一级", () => {
    const readings = [
      { storyLevelId: 5, correctCount: 1, totalCount: 3 },
      { storyLevelId: 5, correctCount: 0, totalCount: 3 },
      { storyLevelId: 5, correctCount: 2, totalCount: 3 },
    ];
    expect(suggestLevelChange({ currentLevel: 5, readings })).toEqual({
      direction: "down",
      toLevel: 4,
    });
  });

  it("已在最低级别(1)时,即使吃力也不建议降级", () => {
    const readings = [
      { storyLevelId: 1, correctCount: 0, totalCount: 3 },
      { storyLevelId: 1, correctCount: 1, totalCount: 3 },
      { storyLevelId: 1, correctCount: 0, totalCount: 3 },
    ];
    expect(suggestLevelChange({ currentLevel: 1, readings })).toBeNull();
  });

  it("只统计当前级别的记录,跨级别的旧记录不参与判断", () => {
    // 当前 L4,但最近 5 篇里只有 2 篇是 L4(其余是入级测评后读过的 L3)
    const readings = [
      { storyLevelId: 4, correctCount: 3, totalCount: 3 },
      { storyLevelId: 4, correctCount: 3, totalCount: 3 },
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
      { storyLevelId: 3, correctCount: 3, totalCount: 3 },
    ];
    // L4 样本不足 5 篇(只有 2),不应升级
    expect(suggestLevelChange({ currentLevel: 4, readings })).toBeNull();
  });
});
