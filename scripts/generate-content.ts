/**
 * 一条命令:直连 Claude API 批量产出故事 → 程序分级校验 → 落 draft + 产出率统计(BACKLOG#2 主条)。
 *
 * 三层内容管线的第 1-2 层(生成 + 程序校验)。落 draft 后仍需人工在 /admin 通读后才能发布
 * (第 3 层,不可省;本脚本不发布)。
 *
 * 用法:
 *   npx tsx scripts/generate-content.ts                         # 用内置「级别×主题」目标清单
 *   npx tsx scripts/generate-content.ts <levelId> <interest> [count]   # 单组目标
 *
 * 环境变量:
 *   ANTHROPIC_API_KEY  必填(写在 .env,不进 git)
 *   GEN_MODEL          模型,默认 claude-opus-4-8
 *   GEN_COUNT          内置清单时每组生成几篇,默认 2
 */

import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { INTERESTS, getLevel } from "../src/lib/levels";
import { cumulativeWordSet, THEME_WORDS } from "../src/lib/wordlists";
import { buildStoryPrompt } from "../src/lib/story-prompt-builder";
import { validateStory, type StoryInput } from "../src/lib/vocab-check";

try {
  process.loadEnvFile(join(__dirname, "..", ".env"));
} catch {
  /* 无 .env 时静默 */
}

const MODEL = process.env.GEN_MODEL ?? "claude-opus-4-8";
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error(
    "未配置 ANTHROPIC_API_KEY。请在 .env 写入 ANTHROPIC_API_KEY=sk-ant-...(不进 git)。"
  );
  process.exit(1);
}
const client = new Anthropic({ apiKey });

const STORIES_DIR = join(__dirname, "..", "content", "stories");

// 内置目标:聚焦 L4-L8,填补级别×主题空缺(与 gen-targets 同口径)
const DEFAULT_TARGET_DEFS: [number, string][] = [
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

interface Target {
  levelId: number;
  interest: string;
  count: number;
}

const [argLevel, argInterest, argCount] = process.argv.slice(2);
let targets: Target[];
if (argLevel && argInterest) {
  if (!INTERESTS.find((i) => i.key === argInterest)) {
    console.error(`未知兴趣主题: ${argInterest}(可选: ${INTERESTS.map((i) => i.key).join(", ")})`);
    process.exit(1);
  }
  targets = [{ levelId: Number(argLevel), interest: argInterest, count: Number(argCount ?? 3) }];
} else {
  const count = Number(process.env.GEN_COUNT ?? 2);
  targets = DEFAULT_TARGET_DEFS.map(([levelId, interest]) => ({ levelId, interest, count }));
}

// 结构化输出 schema(原始 JSON Schema,避免与项目 zod v3 的版本耦合)。
// 模型只产出故事内容;levelId/interest 由目标决定,slug 由程序按标题重建并去重。
interface StoryOut {
  slug: string;
  title: string;
  text: string;
  summary: string;
  glossary: { word: string; zh: string }[];
  questions: { prompt: string; options: string[]; answer: number }[];
}
const OUTPUT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["stories"],
  properties: {
    stories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "title", "text", "summary", "glossary", "questions"],
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          text: { type: "string" },
          summary: { type: "string" },
          glossary: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["word", "zh"],
              properties: { word: { type: "string" }, zh: { type: "string" } },
            },
          },
          questions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["prompt", "options", "answer"],
              properties: {
                prompt: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                answer: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
} as const;

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/\{\{name\}\}/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** 校验错误归类,便于统计拒绝原因 */
function rejectCategory(err: string): string {
  if (err.includes("词数")) return "词数超范围";
  if (err.includes("句长")) return "句长超限";
  if (err.includes("词表外")) return "词表外生词";
  if (err.includes("生词密度")) return "生词密度超标";
  if (err.includes("理解题") || err.includes("选项") || err.includes("答案")) return "题目结构";
  return "其它";
}

const usedSlugs = new Set(
  readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
);

function uniqueSlug(interest: string, levelId: number, title: string): string {
  const base = `${interest}-l${levelId}-${kebab(title) || "story"}`;
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
  usedSlugs.add(slug);
  return slug;
}

const stats = {
  requested: targets.reduce((s, t) => s + t.count, 0),
  written: 0,
  repaired: 0,
  gradingRejected: 0,
  apiFailed: 0,
  reasons: {} as Record<string, number>,
};

/** 自动修补一次:把校验报错连同正文发回模型,要求保持情节修正所有问题;返回候选(不保证已通过) */
async function tryRepair(story: StoryInput, errors: string[]): Promise<StoryInput | null> {
  const level = getLevel(story.levelId);
  const wordList = [...cumulativeWordSet(level.band)].sort().join(", ");
  const themeWords = (THEME_WORDS[story.interest] ?? []).join(", ");
  const prompt = `下面这篇 Level ${level.id} 英文分级故事没通过程序校验。请在【保持情节、级别、主角名 {{name}} 槽位不变】的前提下,修正下面所有报错,返回修正后的同一篇故事(schema 同前:stories 数组含 1 篇)。

# 校验报错(逐条修正)
${errors.join("\n")}

# 修正要点
- 只改报错涉及的地方,别引入任何新的超纲词;改完把正文每个实义词再对照下方词表逐一核对。
- 词表外的词:换成「下方词表 + 本主题词」里的近义词;实在要保留的主题生词才收进 glossary 并给中文释义。
- 词数不足/超范围:增删情节细节调到 ${level.storyWordCount[0]}-${level.storyWordCount[1]}(偏上)。
- 句子超长:拆成两句,任何一句不超过 ${level.maxSentenceWords} 词。
- 不用 he/she/him/her/his 指代 {{name}}。

# 原故事(JSON)
${JSON.stringify({ title: story.title, text: story.text, glossary: story.glossary, summary: story.summary, questions: story.questions })}

# 本主题词(免进 glossary、不算生词)
${themeWords}
# Level ${level.id} 可用词表(band 1-${level.band} 累积)
${wordList}`;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_JSON_SCHEMA } },
    });
    const tb = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!tb) return null;
    const data = JSON.parse(tb.text) as { stories: StoryOut[] };
    const fixed = data.stories?.[0];
    if (!fixed) return null;
    return {
      slug: story.slug,
      title: fixed.title,
      levelId: story.levelId,
      interest: story.interest,
      text: fixed.text,
      glossary: fixed.glossary ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions: fixed.questions as any,
      summary: fixed.summary,
      status: "draft",
    };
  } catch {
    return null;
  }
}

async function run() {
  console.log(`模型 ${MODEL} | 目标 ${targets.length} 组 / 共 ${stats.requested} 篇\n`);

  for (const t of targets) {
    const label = `L${t.levelId} ${t.interest} ×${t.count}`;
    let parsed: { stories: StoryOut[] } | null = null;
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        messages: [
          {
            role: "user",
            content: buildStoryPrompt({
              levelId: t.levelId,
              interest: t.interest,
              count: t.count,
              storiesDir: STORIES_DIR,
              mode: "api",
            }),
          },
        ],
        output_config: { format: { type: "json_schema", schema: OUTPUT_JSON_SCHEMA } },
      });
      const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      if (textBlock) parsed = JSON.parse(textBlock.text) as { stories: StoryOut[] };
    } catch (e) {
      stats.apiFailed += t.count;
      console.log(`❌ ${label} — API/解析失败:${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    if (!parsed?.stories) {
      stats.apiFailed += t.count;
      console.log(`❌ ${label} — 模型未返回有效结果(可能拒答或超长)`);
      continue;
    }

    for (const s of parsed.stories) {
      let story: StoryInput = {
        slug: uniqueSlug(t.interest, t.levelId, s.title),
        title: s.title,
        levelId: t.levelId,
        interest: t.interest,
        text: s.text,
        glossary: s.glossary ?? [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: s.questions as any,
        summary: s.summary,
        status: "draft",
      };
      let result = validateStory(story);
      const needsRepair = !result.ok;
      // 自动修补:最多 2 次迭代,每次把最新版本连同其报错发回模型修
      for (let attempt = 0; attempt < 2 && !result.ok; attempt++) {
        const fixed = await tryRepair(story, result.errors);
        if (!fixed) break;
        story = fixed;
        result = validateStory(fixed);
      }
      const repaired = needsRepair && result.ok;
      if (repaired) stats.repaired++;
      if (!result.ok) {
        stats.gradingRejected++;
        for (const e of result.errors) {
          const cat = rejectCategory(e);
          stats.reasons[cat] = (stats.reasons[cat] ?? 0) + 1;
        }
        console.log(`  ⚠️ 退回 ${story.slug}(修补后仍未过):${result.errors[0]}`);
        usedSlugs.delete(story.slug); // 没落盘,释放 slug
        continue;
      }
      writeFileSync(
        join(STORIES_DIR, `${story.slug}.json`),
        JSON.stringify(story, null, 2) + "\n",
        "utf-8"
      );
      stats.written++;
      console.log(
        `  ✅ ${story.slug}${repaired ? "(修补后)" : ""} — ${result.stats.wordCount} 词 | 最长句 ${result.stats.maxSentenceLen} | 生词密度 ${(result.stats.newWordRatio * 100).toFixed(1)}%`
      );
    }
  }

  const rate = stats.requested === 0 ? 0 : (stats.written / stats.requested) * 100;
  console.log(`\n=== 产出率统计 ===`);
  console.log(
    `请求 ${stats.requested} 篇 → 落 draft ${stats.written} 篇(产出率 ${rate.toFixed(0)}%,其中自动修补救回 ${stats.repaired} 篇)`
  );
  console.log(`分级校验退回 ${stats.gradingRejected} 篇;API 失败/未产出 ${stats.apiFailed} 篇`);
  if (Object.keys(stats.reasons).length > 0) {
    console.log(`退回原因(按校验错误计):`);
    for (const [cat, n] of Object.entries(stats.reasons).sort((a, b) => b[1] - a[1])) {
      console.log(`  - ${cat}: ${n}`);
    }
  }
  console.log(`\n落 draft 的故事需在 /admin 人工通读后才发布(管线第 3 层,不可省)。`);
}

run();
