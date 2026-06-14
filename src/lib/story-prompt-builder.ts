/**
 * 故事生成 prompt 的组装(内容管线第 1 层的输入)。
 *
 * 由两处共用:
 *   - scripts/story-prompt.ts —— 打印 prompt 供人工粘贴(mode "cli")
 *   - scripts/generate-content.ts —— 直连 Claude API 批量产出(mode "api",输出由结构化 schema 约束)
 *
 * 词表 / 级别约束 / 语法来自 levels + wordlists;
 * 「同轨道已有情节,务必避开」来自 story-corpus(BACKLOG#2 情节多样性约束)。
 */

import { getLevel, INTERESTS } from "./levels";
import { cumulativeWordSet } from "./wordlists";
import { loadStoryCorpus, buildAvoidSection } from "./story-corpus";

export interface BuildStoryPromptArgs {
  levelId: number;
  interest: string;
  count: number;
  /** content/stories 目录:读同轨道已有故事的情节梗概做去重 */
  storiesDir: string;
  /** cli:打印可粘贴的 JSON 数组示例;api:输出由结构化 schema 约束 */
  mode?: "cli" | "api";
}

export function buildStoryPrompt({
  levelId,
  interest,
  count,
  storiesDir,
  mode = "cli",
}: BuildStoryPromptArgs): string {
  const level = getLevel(levelId);
  const it = INTERESTS.find((i) => i.key === interest);
  if (!it) {
    throw new Error(`未知兴趣主题: ${interest}(可选: ${INTERESTS.map((i) => i.key).join(", ")})`);
  }

  const wordList = [...cumulativeWordSet(level.band)].sort().join(", ");
  const avoidSection = buildAvoidSection(loadStoryCorpus(storiesDir), it.key);
  const newWordBudget = Math.max(
    2,
    Math.round((level.storyWordCount[1] * level.maxNewWordRatio) / 2)
  );

  const outputSection =
    mode === "api"
      ? `# 输出
按结构化 schema 返回 { "stories": [ ... ] };每篇包含 slug、title、text、glossary、summary、questions。
- slug 用 "${it.key}-l${level.id}-英文短横线标题";title 是英文标题;text 是正文(主角名写作 {{name}})。
- summary 是一句话中文情节梗概(起因-经过-结果),用于以后同轨道情节去重;梗概里用「主角」而非 {{name}}。
- questions 为 3 道单选题,每题 options 3 个;正确答案下标在 0/1/2 间分布。`
      : `# 输出格式(JSON 数组,每篇一个对象,直接可保存为文件)
[
  {
    "slug": "${it.key}-l${level.id}-短横线标题",
    "title": "英文标题",
    "levelId": ${level.id},
    "interest": "${it.key}",
    "text": "正文。{{name}} 是主角名。",
    "glossary": [{ "word": "生词", "zh": "中文释义" }],
    "summary": "一句话中文情节梗概(起因-经过-结果),用于以后同轨道情节去重",
    "questions": [
      { "prompt": "问题", "options": ["A", "B", "C"], "answer": 0 }
    ]
  }
]`;

  return `你是一位专业的英语分级读物作者,为中国 8-12 岁小学生创作「母语化输入」故事。

# 任务
创作 ${count} 篇主题为「${it.label} (${it.key})」的英文短故事,难度为本平台 Level ${level.id}(${level.cefr},约等于牛津树 ${level.oxford})。

# 硬性约束(程序会逐条校验,违反即退回)
1. 词数:每篇 ${level.storyWordCount[0]}-${level.storyWordCount[1]} 词
2. 句长:任何一句不超过 ${level.maxSentenceWords} 个单词
3. 词汇:只能使用下方词表中的词(含其常规屈折变化:复数/过去式/进行时/比较级)
4. 例外:最多 ${newWordBudget} 个词表外的主题生词(如恐龙名),每个必须收录进 glossary 并给出中文释义;生词总出现次数 ≤ 全文词数的 ${(level.maxNewWordRatio * 100).toFixed(0)}%
5. 语法只用:${level.grammar.join(";")}
6. 主角名一律写作 {{name}}(两层花括号,平台会替换为孩子的英文名)。因为名字可能是男孩或女孩,正文绝不用 he/she/him/her/his 指代主角,一律用 {{name}} 或换中性说法。
7. 专有名词(角色名、地名)可以自创,但要简单可读

# 内容红线(任何一条违反整批退回)
- 不出现暴力细节、恐怖、死亡威胁、歧视、政治、宗教元素
- 价值观积极:友爱、勇气、好奇心、坚持
- 故事要有起因-经过-结果,结尾温暖或有趣,不说教

# 情节去重(BACKLOG#2:同轨道相邻级别曾套用同一模板,务必避开)
${avoidSection || "(本轨道暂无已有故事——情节自由发挥,但仍要新颖)"}
- 你写的每一篇情节必须与上面每一条都明显不同,绝不套用同一模板(如「帮迷路小动物找妈妈」「帮小星星发光」「苦练后大赛进球」)。
- 若一次生成多篇,多篇之间情节也要各异。

# 每篇配 3 道理解题
- 单选,3 个选项,考查情节理解(不考语法)
- 题干和选项用词不超出该级别词表

${outputSection}

# Level ${level.id} 可用词表(band 1-${level.band} 累积)
${wordList}`;
}
