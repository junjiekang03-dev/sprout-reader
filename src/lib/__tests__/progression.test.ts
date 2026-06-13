import { describe, it, expect } from "vitest";
import { suggestLevelChange, decideAutoLevelChange } from "../progression";

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

describe("自动跟随调度 decideAutoLevelChange", () => {
  it("自动跟随关闭时,即使有建议也不自动调级", () => {
    expect(
      decideAutoLevelChange({
        autoFollow: false,
        currentLevel: 3,
        suggestion: { direction: "up", toLevel: 4 },
      })
    ).toBeNull();
  });

  it("开启但没有建议时,不自动调级", () => {
    expect(
      decideAutoLevelChange({ autoFollow: true, currentLevel: 3, suggestion: null })
    ).toBeNull();
  });

  it("开启且命中升级建议时,返回升一级的动作", () => {
    expect(
      decideAutoLevelChange({
        autoFollow: true,
        currentLevel: 3,
        suggestion: { direction: "up", toLevel: 4 },
      })
    ).toEqual({ fromLevel: 3, toLevel: 4, direction: "up" });
  });

  it("开启且命中降级建议时,返回降一级的动作", () => {
    expect(
      decideAutoLevelChange({
        autoFollow: true,
        currentLevel: 5,
        suggestion: { direction: "down", toLevel: 4 },
      })
    ).toEqual({ fromLevel: 5, toLevel: 4, direction: "down" });
  });

  it("防御:建议跨度不是 ±1 时拒绝自动调级", () => {
    expect(
      decideAutoLevelChange({
        autoFollow: true,
        currentLevel: 3,
        suggestion: { direction: "up", toLevel: 6 },
      })
    ).toBeNull();
  });

  it("防御:目标级别越界(<1 或 >15)时拒绝", () => {
    expect(
      decideAutoLevelChange({
        autoFollow: true,
        currentLevel: 1,
        suggestion: { direction: "down", toLevel: 0 },
      })
    ).toBeNull();
    expect(
      decideAutoLevelChange({
        autoFollow: true,
        currentLevel: 15,
        suggestion: { direction: "up", toLevel: 16 },
      })
    ).toBeNull();
  });
});
