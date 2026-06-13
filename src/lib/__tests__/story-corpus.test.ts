import { describe, it, expect } from "vitest";
import { buildAvoidSection, type CorpusStory } from "../story-corpus";

/**
 * 情节去重语料的纯函数门禁。
 * buildAvoidSection 是生成新故事时「同轨道情节去重」的核心:
 * 把同一兴趣轨道已有故事的情节梗概拼成 prompt 段,要求模型避开。
 */
const STORIES: CorpusStory[] = [
  { slug: "soccer-l7-b", interest: "soccer", levelId: 7, title: "B", summary: "苦练后绝杀进球" },
  { slug: "soccer-l4-a", interest: "soccer", levelId: 4, title: "A", summary: "朋友小赛进球" },
  { slug: "space-l5-c", interest: "space", levelId: 5, title: "C", summary: "帮小星星发光" },
];

describe("情节去重语料 buildAvoidSection", () => {
  it("只列出目标轨道的故事,且按级别升序", () => {
    const out = buildAvoidSection(STORIES, "soccer");
    expect(out).toContain("苦练后绝杀进球");
    expect(out).toContain("朋友小赛进球");
    expect(out).not.toContain("帮小星星发光"); // 别的轨道不混入
    expect(out.indexOf("L4")).toBeLessThan(out.indexOf("L7")); // 升序
  });

  it("excludeSlug 把指定故事排除(重写某篇时不把它自己列入)", () => {
    const out = buildAvoidSection(STORIES, "soccer", { excludeSlug: "soccer-l7-b" });
    expect(out).toContain("朋友小赛进球");
    expect(out).not.toContain("苦练后绝杀进球");
  });

  it("目标轨道无已有故事时返回空串(不污染 prompt)", () => {
    expect(buildAvoidSection(STORIES, "magic")).toBe("");
  });

  it("缺 summary 时回退而不抛错", () => {
    const out = buildAvoidSection(
      [{ slug: "x", interest: "magic", levelId: 4, title: "X" }],
      "magic"
    );
    expect(out).toContain("X");
  });

  it("标题里的 {{name}} 槽位被替换,不泄漏进梗概段", () => {
    const out = buildAvoidSection(
      [
        {
          slug: "y",
          interest: "magic",
          levelId: 4,
          title: "{{name}} and the Hat",
          summary: "学魔法",
        },
      ],
      "magic"
    );
    expect(out).not.toContain("{{name}}");
    expect(out).toContain("and the Hat");
  });
});
