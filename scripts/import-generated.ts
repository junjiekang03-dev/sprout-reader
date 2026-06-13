/**
 * 导入 Workflow 批量生成的故事(三层内容管线的落地步骤)。
 *
 *   生成(workflow agent) → 安全审核(workflow agent) → 【本脚本:程序化分级校验】 → 写入 draft
 *
 * 只有「安全审核通过 且 分级校验通过」的故事才会被写入 content/stories/(status=draft),
 * 等人工在 /admin 通读后发布。两道门都不可绕过。
 *
 * 用法:npx tsx scripts/import-generated.ts <workflow-output-file>
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { validateStory, type StoryInput } from "../src/lib/vocab-check";

const outputFile = process.argv[2];
if (!outputFile || !existsSync(outputFile)) {
  console.error("用法:npx tsx scripts/import-generated.ts <workflow-output-file>");
  process.exit(1);
}

// workflow 输出文件是一个对象 { summary, logs, result: [...] };result 即 return 值
const raw = readFileSync(outputFile, "utf-8");
const parsed = JSON.parse(raw) as { result?: unknown };
if (!Array.isArray(parsed.result)) {
  console.error("输出文件中没有 result 数组");
  process.exit(1);
}
const results = parsed.result as Array<{
  target: { levelId: number; interest: string };
  story: {
    title: string;
    text: string;
    glossary: { word: string; zh: string }[];
    questions: unknown[];
  };
  verdict: { safe: boolean; valuesPositive: boolean; ageAppropriate: boolean; issues: string[] };
}>;

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/\{\{name\}\}/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const STORIES_DIR = join(__dirname, "..", "content", "stories");
let written = 0;
let safetyRejected = 0;
let gradingRejected = 0;

for (const r of results) {
  if (!r?.story || !r?.verdict) continue;
  const v = r.verdict;
  if (!(v.safe && v.valuesPositive && v.ageAppropriate)) {
    safetyRejected++;
    console.log(`🚫 安全审核未过:${r.story.title} — ${v.issues.join("; ")}`);
    continue;
  }
  const t = r.target;
  const slug = `${t.interest}-l${t.levelId}-${kebab(r.story.title)}`;
  const story: StoryInput = {
    slug,
    title: r.story.title,
    levelId: t.levelId,
    interest: t.interest,
    text: r.story.text,
    glossary: r.story.glossary ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions: r.story.questions as any,
    status: "draft",
  };

  const result = validateStory(story);
  if (!result.ok) {
    gradingRejected++;
    console.log(`❌ 分级校验未过 ${slug}:\n   ${result.errors.join("\n   ")}`);
    continue;
  }

  writeFileSync(join(STORIES_DIR, `${slug}.json`), JSON.stringify(story, null, 2) + "\n", "utf-8");
  written++;
  console.log(
    `✅ ${slug} — ${result.stats.wordCount} 词 | 最长句 ${result.stats.maxSentenceLen} | 生词密度 ${(result.stats.newWordRatio * 100).toFixed(1)}%`
  );
}

console.log(
  `\n共 ${results.length} 篇:写入 draft ${written},安全审核拒绝 ${safetyRejected},分级校验拒绝 ${gradingRejected}`
);
