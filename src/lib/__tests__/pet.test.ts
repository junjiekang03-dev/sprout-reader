import { describe, it, expect } from "vitest";
import { SPECIES, getSpecies, petScore, petStage, petProgress, MAX_STAGE } from "../pet";
import type { BadgeStats } from "../badges";

function stats(over: Partial<BadgeStats> = {}): BadgeStats {
  return {
    storiesRead: 0,
    daysActive: 0,
    streak: 0,
    perfectQuizzes: 0,
    wordbookSize: 0,
    wordsMastered: 0,
    wordsRead: 0,
    level: 1,
    earlyBird: false,
    ...over,
  };
}

describe("萌宠种类 SPECIES", () => {
  it("有 3 只可选,每只 3 个阶段名,key 唯一", () => {
    expect(SPECIES).toHaveLength(3);
    SPECIES.forEach((s) => expect(s.stageNames).toHaveLength(3));
    expect(new Set(SPECIES.map((s) => s.key)).size).toBe(3);
  });
  it("getSpecies 命中/未命中", () => {
    expect(getSpecies("dragon")?.name).toBe("芽芽龙");
    expect(getSpecies("nope")).toBeUndefined();
  });
});

describe("成长值 petScore(派生自真实信号,偏向真学了)", () => {
  it("零信号成长值为 0", () => {
    expect(petScore(stats())).toBe(0);
  });
  it("按权重累加:读完×10 + 全对×8 + 牢记词×6 + 打卡天数×3(封顶30)", () => {
    expect(
      petScore(stats({ storiesRead: 3, perfectQuizzes: 4, wordsMastered: 0, daysActive: 7 }))
    ).toBe(3 * 10 + 4 * 8 + 0 + 7 * 3);
  });
  it("打卡天数用 daysActive(单调累积)而非会断的连读 streak —— 断签不掉成长值", () => {
    // streak 归零不影响成长值(只看累计打卡天数 daysActive),保证只升不降
    expect(petScore(stats({ daysActive: 10, streak: 0 }))).toBe(10 * 3);
    expect(petScore(stats({ daysActive: 10, streak: 5 }))).toBe(10 * 3);
  });
  it("打卡天数对成长值的贡献封顶 30 天", () => {
    const a = petScore(stats({ daysActive: 30 }));
    const b = petScore(stats({ daysActive: 100 }));
    expect(a).toBe(b);
  });
});

describe("成长阶段 petStage(只升不降、阈值边界)", () => {
  it("阈值边界:<60 幼(0),60-179 少年(1),>=180 成年(2)", () => {
    expect(petStage(0)).toBe(0);
    expect(petStage(59)).toBe(0);
    expect(petStage(60)).toBe(1);
    expect(petStage(179)).toBe(1);
    expect(petStage(180)).toBe(2);
    expect(petStage(9999)).toBe(MAX_STAGE);
  });
});

describe("进度 petProgress", () => {
  it("阶段内进度 into/span/pct/toNext", () => {
    const p = petProgress(90); // stage1: [60,180)
    expect(p.stage).toBe(1);
    expect(p.into).toBe(30);
    expect(p.span).toBe(120);
    expect(p.pct).toBe(25);
    expect(p.toNext).toBe(90);
    expect(p.atMax).toBe(false);
  });
  it("成年(满阶)进度封顶、toNext=0、atMax", () => {
    const p = petProgress(500);
    expect(p.stage).toBe(MAX_STAGE);
    expect(p.pct).toBe(100);
    expect(p.toNext).toBe(0);
    expect(p.atMax).toBe(true);
  });
});
