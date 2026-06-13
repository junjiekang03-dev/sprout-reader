import { describe, it, expect } from "vitest";
import { validateStory, type StoryInput } from "../vocab-check";

/**
 * 这些是「回归测试」:对应内容校验器开发期修过的三个真实 bug。
 * 行为已修复,测试在此锁定它,防止后续重构再次破坏分级门禁。
 */

const baseQuestions: StoryInput["questions"] = [
  { prompt: "Q1", options: ["a", "b", "c"], answer: 0 },
  { prompt: "Q2", options: ["a", "b", "c"], answer: 0 },
  { prompt: "Q3", options: ["a", "b", "c"], answer: 0 },
];

function story(overrides: Partial<StoryInput>): StoryInput {
  return {
    slug: "test-story",
    title: "Test",
    levelId: 3,
    interest: "animals",
    text: "",
    glossary: [],
    questions: baseQuestions,
    ...overrides,
  };
}

describe("vocab-check 分级校验回归", () => {
  it("引号结尾的句子能正确切分,不会把对话和下一句算成一句导致句长虚高", () => {
    // 修复前:`"Look at the cat!" The cat is on the bed.` 被当成 1 句(9 词 > 7)误报句长超限
    const text =
      "{{name}} has a little dog. The dog can run fast. The dog can jump too. " +
      '{{name}} sees a big cat. "Look at the cat!" The cat is on the bed. ' +
      'The cat looks at the dog. The dog runs to the cat. "Stop, dog! Stop!" ' +
      "The cat is not happy. The cat jumps up. {{name}} gets the cat. " +
      "The dog and the cat play. They are happy.";
    const result = validateStory(story({ text }));
    expect(result.errors.filter((e) => e.includes("句长"))).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("角色名的所有格(含名字槽位 {{name}}'s)被识别为专有名词,不报词表外", () => {
    // 修复前:soccer-l9 里 `Sam's`(名字槽位替换后)被当成词表外生词
    const text =
      "This is {{name}}. {{name}} has a dog. {{name}}'s dog is little. " +
      "The dog can run fast. The dog can jump. {{name}} likes the dog. " +
      "The dog likes {{name}} too. {{name}}'s dog is happy. {{name}} is happy too. " +
      "The dog can see a cat. The cat is on the bed. The dog runs to the cat. " +
      "The cat jumps up. {{name}} gets the cat. They play and play. It is a good day.";
    const result = validateStory(story({ text }));
    expect(result.stats.outOfListWords).not.toContain("sam's");
    expect(result.errors.filter((e) => e.includes("词表外"))).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("正文缺少 {{name}} 名字槽位时给出警告(定制感卖点的护栏)", () => {
    const text =
      "The dog is little. The dog can run fast. The dog can jump too. " +
      "The cat is big. The cat is on the bed. The cat looks at the dog. " +
      "The dog runs to the cat. The cat jumps up. The dog and the cat play. " +
      "They are happy. It is a good day. The sun is up. The dog can see the sun.";
    const result = validateStory(story({ text }));
    expect(result.warnings.some((w) => w.includes("{{name}}"))).toBe(true);
  });
});
