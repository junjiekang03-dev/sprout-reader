/**
 * 程序化分级校验核心:词表、句长、生词密度。
 * 被 scripts/validate-stories.ts(上架门禁)使用;管线第 2 层(脚本校验)。
 */

import { getLevel } from "./levels";
import { cumulativeWordSet } from "./wordlists";
import type { GlossaryEntry, QuizQuestion } from "./story-types";

/** 常见不规则形(还原到词表原形) */
const IRREGULAR: Record<string, string> = {
  went: "go",
  gone: "go",
  saw: "see",
  seen: "see",
  ran: "run",
  ate: "eat",
  eaten: "eat",
  got: "get",
  gotten: "get",
  made: "make",
  took: "take",
  taken: "take",
  gave: "give",
  given: "give",
  found: "find",
  knew: "know",
  known: "know",
  thought: "think",
  told: "tell",
  said: "say",
  came: "come",
  did: "do",
  done: "do",
  had: "have",
  was: "be",
  were: "be",
  been: "be",
  flew: "fly",
  flown: "fly",
  swam: "swim",
  swum: "swim",
  sang: "sing",
  sung: "sing",
  drank: "drink",
  drunk: "drink",
  slept: "sleep",
  kept: "keep",
  left: "leave",
  lost: "lose",
  met: "meet",
  sat: "sit",
  stood: "stand",
  won: "win",
  wore: "wear",
  worn: "wear",
  woke: "wake",
  woken: "wake",
  broke: "break",
  broken: "break",
  brought: "bring",
  built: "build",
  caught: "catch",
  chose: "choose",
  chosen: "choose",
  fell: "fall",
  fallen: "fall",
  felt: "feel",
  fought: "fight",
  forgot: "forget",
  forgotten: "forget",
  grew: "grow",
  grown: "grow",
  heard: "hear",
  held: "hold",
  hid: "hide",
  hidden: "hide",
  hurt: "hurt",
  let: "let",
  put: "put",
  rode: "ride",
  ridden: "ride",
  rang: "ring",
  rung: "ring",
  rose: "rise",
  risen: "rise",
  "can't": "can",
  "won't": "will",
  cannot: "can",
  sent: "send",
  shook: "shake",
  shaken: "shake",
  shone: "shine",
  spoke: "speak",
  spoken: "speak",
  spent: "spend",
  stuck: "stick",
  threw: "throw",
  thrown: "throw",
  understood: "understand",
  bought: "buy",
  paid: "pay",
  taught: "teach",
  wrote: "write",
  written: "write",
  drew: "draw",
  drawn: "draw",
  drove: "drive",
  driven: "drive",
  swept: "sweep",
  blew: "blow",
  blown: "blow",
  began: "begin",
  begun: "begin",
  became: "become",
  beat: "beat",
  bit: "bite",
  bitten: "bite",
  burst: "burst",
  cost: "cost",
  cut: "cut",
  dug: "dig",
  froze: "freeze",
  frozen: "freeze",
  led: "lead",
  lay: "lie",
  lain: "lie",
  lit: "light",
  meant: "mean",
  sold: "sell",
  shot: "shoot",
  tore: "tear",
  torn: "tear",
  children: "child",
  teeth: "tooth",
  feet: "foot",
  mice: "mouse",
  men: "man",
  women: "woman",
  better: "good",
  best: "good",
  worse: "bad",
  worst: "bad",
  leaves: "leaf",
  wolves: "wolf",
  babies: "baby",
  stories: "story",
  themselves: "they",
};

/** 把一个 token 还原成可能的原形候选 */
function lemmaCandidates(raw: string): string[] {
  const w = raw.toLowerCase();
  const out = new Set<string>([w]);
  if (IRREGULAR[w]) out.add(IRREGULAR[w]);

  // 所有格/缩写
  for (const suf of ["'s", "'ll", "'re", "'ve", "'d", "'m", "n't"]) {
    if (w.endsWith(suf)) out.add(w.slice(0, -suf.length));
  }
  const base = w.replace(/'/g, "");
  out.add(base);

  const tryAdd = (s: string) => {
    if (s.length >= 2) out.add(s);
  };
  // 复数/三单
  if (base.endsWith("ies")) tryAdd(base.slice(0, -3) + "y");
  if (base.endsWith("es")) tryAdd(base.slice(0, -2));
  if (base.endsWith("s")) tryAdd(base.slice(0, -1));
  // 过去式
  if (base.endsWith("ied")) tryAdd(base.slice(0, -3) + "y");
  if (base.endsWith("ed")) {
    tryAdd(base.slice(0, -2)); // jumped → jump
    tryAdd(base.slice(0, -1)); // liked → like
    if (base.length > 4 && base[base.length - 3] === base[base.length - 4]) {
      tryAdd(base.slice(0, -3)); // stopped → stop
    }
  }
  // 进行时
  if (base.endsWith("ing")) {
    tryAdd(base.slice(0, -3)); // playing → play
    tryAdd(base.slice(0, -3) + "e"); // making → make
    if (base.length > 5 && base[base.length - 4] === base[base.length - 5]) {
      tryAdd(base.slice(0, -4)); // running → run
    }
  }
  // 副词/比较级
  if (base.endsWith("ly")) tryAdd(base.slice(0, -2));
  if (base.endsWith("ier")) tryAdd(base.slice(0, -3) + "y");
  if (base.endsWith("iest")) tryAdd(base.slice(0, -4) + "y");
  if (base.endsWith("er")) {
    tryAdd(base.slice(0, -2));
    tryAdd(base.slice(0, -1)); // nicer → nice
  }
  if (base.endsWith("est")) {
    tryAdd(base.slice(0, -3));
    tryAdd(base.slice(0, -2)); // nicest → nice
  }
  return [...out];
}

export interface StoryInput {
  slug: string;
  title: string;
  levelId: number;
  interest: string;
  text: string;
  glossary: GlossaryEntry[];
  questions: QuizQuestion[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    wordCount: number;
    maxSentenceLen: number;
    outOfListWords: string[];
    newWordRatio: number;
  };
}

export function validateStory(story: StoryInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const level = getLevel(story.levelId);
  const allowed = cumulativeWordSet(level.band);
  const glossaryWords = new Set(story.glossary.map((g) => g.word.toLowerCase()));

  // 名字槽位在词频统计前移除(渲染时会替换为孩子名字)
  const text = story.text.replaceAll("{{name}}", "Sam");

  // 句子切分与句长(句末标点后可跟引号,如 ball!" 或 said.")
  const sentences = text
    .split(/(?<=[.!?]["'”’]?)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let maxSentenceLen = 0;
  for (const s of sentences) {
    const words = s.split(/\s+/).filter((t) => /[a-zA-Z]/.test(t));
    maxSentenceLen = Math.max(maxSentenceLen, words.length);
    if (words.length > level.maxSentenceWords) {
      errors.push(`句长超限(${words.length} > ${level.maxSentenceWords}): "${s.slice(0, 60)}..."`);
    }
  }

  // 逐词校验
  const tokens: { raw: string; isSentenceStart: boolean }[] = [];
  for (const s of sentences) {
    const ws = s.match(/[a-zA-Z][a-zA-Z']*/g) ?? [];
    ws.forEach((w, i) => tokens.push({ raw: w, isSentenceStart: i === 0 }));
  }

  const wordCount = tokens.length;
  if (wordCount < level.storyWordCount[0] || wordCount > level.storyWordCount[1]) {
    errors.push(
      `词数 ${wordCount} 不在 Level ${level.id} 要求的 [${level.storyWordCount[0]}, ${level.storyWordCount[1]}] 内`
    );
  }

  // 两遍式专有名词识别:先收集「非句首出现过的大写词」(角色名/地名),
  // 第二遍即使它出现在句首也放行。名字槽位占位词 sam 恒为专有名词。
  const properNouns = new Set<string>(["sam"]);
  for (const t of tokens) {
    if (!t.isSentenceStart && /^[A-Z]/.test(t.raw)) {
      const lower = t.raw.toLowerCase();
      properNouns.add(lower);
      properNouns.add(lower.replace(/'s$/, "")); // Sam's → sam
    }
  }

  const outOfList = new Set<string>();
  for (const t of tokens) {
    const lower = t.raw.toLowerCase();
    if (
      /^[A-Z]/.test(t.raw) &&
      (properNouns.has(lower) || properNouns.has(lower.replace(/'s$/, "")))
    )
      continue;
    const candidates = lemmaCandidates(t.raw);
    const inList = candidates.some((c) => allowed.has(c));
    const inGlossary = candidates.some((c) => glossaryWords.has(c)) || glossaryWords.has(lower);
    if (!inList && !inGlossary) outOfList.add(lower);
  }

  // 词表外且不在词汇表 → 硬错误
  for (const w of outOfList) {
    errors.push(`词表外生词未收录进 glossary: "${w}"`);
  }

  // 生词密度 = glossary 词出现次数 / 总词数
  let glossaryHits = 0;
  for (const t of tokens) {
    const candidates = lemmaCandidates(t.raw);
    if (candidates.some((c) => glossaryWords.has(c))) glossaryHits++;
  }
  const newWordRatio = wordCount === 0 ? 0 : glossaryHits / wordCount;
  if (newWordRatio > level.maxNewWordRatio) {
    errors.push(
      `生词密度 ${(newWordRatio * 100).toFixed(1)}% 超过 Level ${level.id} 上限 ${(level.maxNewWordRatio * 100).toFixed(1)}%`
    );
  }

  if (story.glossary.length > 8) {
    warnings.push(`词汇表 ${story.glossary.length} 条偏多,建议 ≤ 8`);
  }

  // 理解题
  if (story.questions.length !== 3) {
    errors.push(`理解题须为 3 道,当前 ${story.questions.length}`);
  }
  story.questions.forEach((q, i) => {
    if (q.options.length < 3 || q.options.length > 4) {
      errors.push(`第 ${i + 1} 题选项数须为 3-4,当前 ${q.options.length}`);
    }
    if (q.answer < 0 || q.answer >= q.options.length) {
      errors.push(`第 ${i + 1} 题答案下标越界`);
    }
  });

  if (!story.text.includes("{{name}}")) {
    warnings.push("正文没有 {{name}} 名字槽位(定制感卖点),确认是否有意为之");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: { wordCount, maxSentenceLen, outOfListWords: [...outOfList], newWordRatio },
  };
}

/** 导入/seed 时统计词数(与校验同口径) */
export function countWords(text: string): number {
  const t = text.replaceAll("{{name}}", "Sam");
  return (t.match(/[a-zA-Z][a-zA-Z']*/g) ?? []).length;
}
