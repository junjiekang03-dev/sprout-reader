/**
 * 上架门禁:校验 content/stories/*.json 的分级约束。
 * 用法:npm run validate:stories
 * 全部通过 → exit 0;任一失败 → exit 1(列出错误)。
 *
 * 管线位置:AI 生成 → 【本脚本:程序化校验】→ AI 交叉审 → 人工通读 → seed 入库
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { validateStory } from "../src/lib/vocab-check";
import { LEVELS, INTERESTS } from "../src/lib/levels";

const STORIES_DIR = join(__dirname, "..", "content", "stories");

const storySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  levelId: z.number().int().min(1).max(LEVELS.length),
  interest: z.enum(INTERESTS.map((i) => i.key) as [string, ...string[]]),
  text: z.string().min(10),
  glossary: z.array(z.object({ word: z.string(), zh: z.string() })),
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        options: z.array(z.string()).min(3).max(4),
        answer: z.number().int(),
      })
    )
    .length(3),
});

const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.log("content/stories/ 下没有故事文件");
  process.exit(1);
}

let failed = 0;
const slugs = new Set<string>();

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(STORIES_DIR, file), "utf-8"));
  const parsed = storySchema.safeParse(raw);
  if (!parsed.success) {
    failed++;
    console.log(`\n❌ ${file} — schema 错误:`);
    for (const issue of parsed.error.issues) {
      console.log(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    continue;
  }
  const story = parsed.data;
  if (slugs.has(story.slug)) {
    failed++;
    console.log(`\n❌ ${file} — slug 重复: ${story.slug}`);
    continue;
  }
  slugs.add(story.slug);

  const result = validateStory(story);
  if (!result.ok) {
    failed++;
    console.log(`\n❌ ${file} (L${story.levelId} ${story.interest})`);
    for (const e of result.errors) console.log(`   错误: ${e}`);
  } else {
    const s = result.stats;
    console.log(
      `✅ ${file} — L${story.levelId} ${story.interest} | ${s.wordCount} 词 | 最长句 ${s.maxSentenceLen} | 生词密度 ${(s.newWordRatio * 100).toFixed(1)}%`
    );
  }
  for (const w of result.warnings) console.log(`   ⚠️ ${w}`);
}

console.log(`\n共 ${files.length} 篇,失败 ${failed} 篇`);
process.exit(failed > 0 ? 1 : 0);
