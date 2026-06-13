/**
 * 生成「故事生成 prompt」——内容管线第 1 层的输入。
 *
 * 用法:npx tsx scripts/story-prompt.ts <levelId> <interestKey> [数量]
 * 例如:npx tsx scripts/story-prompt.ts 3 dinosaurs 5
 *
 * 输出的 prompt 粘贴给 Claude/GPT(或将来接 API 批量跑),
 * 模型按 JSON 格式返回故事,落盘到 content/stories/ 后跑 validate:stories。
 */

import { getLevel, INTERESTS } from "../src/lib/levels";
import { cumulativeWordSet } from "../src/lib/wordlists";

const levelId = Number(process.argv[2] ?? 3);
const interestKey = process.argv[3] ?? "dinosaurs";
const count = Number(process.argv[4] ?? 3);

const level = getLevel(levelId);
const interest = INTERESTS.find((i) => i.key === interestKey);
if (!interest) {
  console.error(`未知兴趣主题: ${interestKey}(可选: ${INTERESTS.map((i) => i.key).join(", ")})`);
  process.exit(1);
}

const wordList = [...cumulativeWordSet(level.band)].sort().join(", ");

const prompt = `你是一位专业的英语分级读物作者,为中国 8-12 岁小学生创作「母语化输入」故事。

# 任务
创作 ${count} 篇主题为「${interest.label} (${interest.key})」的英文短故事,难度为本平台 Level ${level.id}(${level.cefr},约等于牛津树 ${level.oxford})。

# 硬性约束(程序会逐条校验,违反即退回)
1. 词数:每篇 ${level.storyWordCount[0]}-${level.storyWordCount[1]} 词
2. 句长:任何一句不超过 ${level.maxSentenceWords} 个单词
3. 词汇:只能使用下方词表中的词(含其常规屈折变化:复数/过去式/进行时/比较级)
4. 例外:最多 ${Math.max(2, Math.round((level.storyWordCount[1] * level.maxNewWordRatio) / 2))} 个词表外的主题生词(如恐龙名),每个必须收录进 glossary 并给出中文释义;生词总出现次数 ≤ 全文词数的 ${(level.maxNewWordRatio * 100).toFixed(0)}%
5. 语法只用:${level.grammar.join(";")}
6. 主角名一律写作 {{name}}(两层花括号,平台会替换为孩子的英文名)
7. 专有名词(角色名、地名)可以自创,但要简单可读

# 内容红线(任何一条违反整批退回)
- 不出现暴力细节、恐怖、死亡威胁、歧视、政治、宗教元素
- 价值观积极:友爱、勇气、好奇心、坚持
- 故事要有起因-经过-结果,结尾温暖或有趣,不说教

# 每篇配 3 道理解题
- 单选,3 个选项,考查情节理解(不考语法)
- 题干和选项用词不超出该级别词表

# 输出格式(JSON 数组,每篇一个对象,直接可保存为文件)
[
  {
    "slug": "${interest.key}-l${level.id}-短横线标题",
    "title": "英文标题",
    "levelId": ${level.id},
    "interest": "${interest.key}",
    "text": "正文。{{name}} 是主角名。",
    "glossary": [{ "word": "生词", "zh": "中文释义" }],
    "questions": [
      { "prompt": "问题", "options": ["A", "B", "C"], "answer": 0 }
    ]
  }
]

# Level ${level.id} 可用词表(band 1-${level.band} 累积)
${wordList}`;

console.log(prompt);
