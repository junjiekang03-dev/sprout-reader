/**
 * 输出批量生成所需的「目标组合」JSON(级别约束 + 语法 + 主题),喂给 Workflow 作为 args。
 * 词表合规不在生成时强塞 prompt,而由生成后的 validateStory 程序校验把关(三层管线的第 2 层)。
 *
 * 用法:npx tsx scripts/gen-targets.ts
 */

import { join } from "path";
import { getLevel, INTERESTS } from "../src/lib/levels";
import { loadStoryCorpus, buildAvoidSection } from "../src/lib/story-corpus";

// 聚焦 L4-L8(句长上限 8-12 词,AI 较易达标),填补现有种子故事的级别×主题空缺
const targetDefs: [number, string][] = [
  [4, "animals"],
  [4, "space"],
  [4, "magic"],
  [5, "dinosaurs"],
  [5, "soccer"],
  [5, "space"],
  [6, "princess"],
  [6, "space"],
  [6, "dinosaurs"],
  [7, "animals"],
  [7, "magic"],
  [7, "soccer"],
  [8, "soccer"],
  [8, "animals"],
  [8, "princess"],
];

// 同轨道已有情节梗概,随 target 一起喂 Workflow 做情节去重(BACKLOG#2 多样性约束)
const corpus = loadStoryCorpus(join(__dirname, "..", "content", "stories"));

const targets = targetDefs.map(([levelId, interest], i) => {
  const lv = getLevel(levelId);
  const it = INTERESTS.find((x) => x.key === interest)!;
  return {
    idx: i + 1,
    levelId,
    interest,
    interestLabel: it.label,
    band: lv.band,
    levelName: lv.name,
    cefr: lv.cefr,
    oxford: lv.oxford,
    wordCount: lv.storyWordCount,
    maxSentenceWords: lv.maxSentenceWords,
    maxNewWordRatio: lv.maxNewWordRatio,
    newWordBudget: Math.max(2, Math.round((lv.storyWordCount[1] * lv.maxNewWordRatio) / 2)),
    grammar: lv.grammar,
    avoidPlots: buildAvoidSection(corpus, interest),
  };
});

console.log(JSON.stringify({ targets }, null, 2));
