/**
 * 内容去重语料(BACKLOG#2 情节多样性约束)。
 *
 * 生成新故事时,把【同一兴趣轨道】已有故事的情节梗概喂给模型,要求新故事的情节
 * 与每一条都明显不同,避免相邻级别套用同一模板(如「帮迷路小动物找妈妈」
 * 「帮小星星发光」「苦练后大赛进球」——首批批量产出实测踩过的坑)。
 *
 * - buildAvoidSection 是纯函数(有单测守护);
 * - loadStoryCorpus 是薄 I/O,读取 content/stories/*.json。
 * 梗概来自每篇故事可选的 summary 字段;缺失时回退到标题,不阻断生成。
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export interface CorpusStory {
  slug: string;
  interest: string;
  levelId: number;
  title: string;
  /** 一句话情节梗概(起因-经过-结果),供同轨道去重比对 */
  summary?: string;
}

export interface AvoidSectionOptions {
  /** 排除某个 slug——重写某篇时,不要把它自己列进「要避开」的清单里 */
  excludeSlug?: string;
}

/** 把单篇压成一行「L{级别}《{标题}》:{梗概}」;标题里的名字槽位先替换掉 */
function lineFor(story: CorpusStory): string {
  const title = story.title.replaceAll("{{name}}", "主角");
  const gist = story.summary?.trim() ? story.summary.trim() : "(暂无梗概,仅标题)";
  return `- L${story.levelId}《${title}》:${gist}`;
}

/**
 * 纯函数:给定全部故事 + 目标兴趣轨道,产出「本轨道已有情节(必须避开)」prompt 段。
 * 同轨道无已有故事时返回空串(不污染 prompt)。
 */
export function buildAvoidSection(
  stories: CorpusStory[],
  interest: string,
  opts: AvoidSectionOptions = {}
): string {
  const inTrack = stories
    .filter((s) => s.interest === interest && s.slug !== opts.excludeSlug)
    .sort((a, b) => a.levelId - b.levelId);
  if (inTrack.length === 0) return "";
  const lines = inTrack.map(lineFor).join("\n");
  return `# 本轨道(${interest})已有故事情节 — 新故事必须与每一条都明显不同,绝不套用同一模板\n${lines}`;
}

/** I/O:读取 content/stories 目录下所有故事为去重语料(只取去重需要的字段)。 */
export function loadStoryCorpus(storiesDir: string): CorpusStory[] {
  const files = readdirSync(storiesDir).filter((f) => f.endsWith(".json"));
  const out: CorpusStory[] = [];
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(storiesDir, f), "utf-8")) as CorpusStory;
    out.push({
      slug: raw.slug,
      interest: raw.interest,
      levelId: raw.levelId,
      title: raw.title,
      summary: raw.summary,
    });
  }
  return out;
}
