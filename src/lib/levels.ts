/**
 * 自研分级体系(15 级,双坐标映射)
 *
 * 底层锚定 CEFR + 课标词表(band 词表见 wordlists.ts),
 * 对外同时映射「牛津树级别」和「校内年级」两套家长能看懂的坐标。
 *
 * 每级的约束参数(词汇量上限、句长、生词密度、篇幅)同时是:
 *   1. AI 生成故事时的 prompt 约束
 *   2. validate-stories 脚本的程序化校验标准
 *   3. 入级测评的难度阶梯
 */

export type Band = 1 | 2 | 3 | 4 | 5;

export interface Level {
  /** 级别 1-15 */
  id: number;
  /** 孩子可见的级别名(成长意象,避免「第 N 级」的压迫感) */
  name: string;
  /** CEFR 锚点 */
  cefr: string;
  /** 牛津树级别映射(家长坐标 1) */
  oxford: string;
  /** 校内年级映射(家长坐标 2) */
  gradeLabel: string;
  /** 词表 band(1-5,累积生效:Level 的可用词 = 该 band 及以下所有词表) */
  band: Band;
  /** 目标累计词汇量(校验与展示用) */
  vocabSize: number;
  /** 单篇故事词数范围 [min, max] */
  storyWordCount: [number, number];
  /** 单句最大词数 */
  maxSentenceWords: number;
  /** 允许的「词表外生词」密度上限(0.03 = 3%,生词必须进故事词汇表) */
  maxNewWordRatio: number;
  /** 该级别可用的语法范围(生成 prompt 用) */
  grammar: string[];
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Seed 种子",
    cefr: "pre-A1",
    oxford: "ORT 1+",
    gradeLabel: "三年级起步(零基础)",
    band: 1,
    vocabSize: 50,
    storyWordCount: [30, 60],
    maxSentenceWords: 5,
    maxNewWordRatio: 0.05,
    grammar: ["This is...", "I see...", "I like...", "单数名词+颜色/数字"],
  },
  {
    id: 2,
    name: "Sprout 发芽",
    cefr: "pre-A1",
    oxford: "ORT 2",
    gradeLabel: "三年级上",
    band: 1,
    vocabSize: 100,
    storyWordCount: [40, 80],
    maxSentenceWords: 6,
    maxNewWordRatio: 0.05,
    grammar: ["be 动词肯定句", "I have...", "It is...", "简单祈使句"],
  },
  {
    id: 3,
    name: "Leaf 长叶",
    cefr: "pre-A1",
    oxford: "ORT 3",
    gradeLabel: "三年级下",
    band: 1,
    vocabSize: 180,
    storyWordCount: [60, 100],
    maxSentenceWords: 7,
    maxNewWordRatio: 0.05,
    grammar: ["一般现在时(第一/二人称)", "can + 动词", "where/what 简单疑问"],
  },
  {
    id: 4,
    name: "Stem 抽枝",
    cefr: "pre-A1+",
    oxford: "ORT 4",
    gradeLabel: "四年级上",
    band: 2,
    vocabSize: 250,
    storyWordCount: [80, 130],
    maxSentenceWords: 8,
    maxNewWordRatio: 0.04,
    grammar: ["一般现在时(第三人称单数)", "现在进行时", "there is/are"],
  },
  {
    id: 5,
    name: "Bud 含苞",
    cefr: "A1-",
    oxford: "ORT 4-5",
    gradeLabel: "四年级",
    band: 2,
    vocabSize: 320,
    storyWordCount: [100, 160],
    maxSentenceWords: 9,
    maxNewWordRatio: 0.04,
    grammar: ["want/like to do", "形容词比较", "时间表达(today, now)"],
  },
  {
    id: 6,
    name: "Bloom 开花",
    cefr: "A1",
    oxford: "ORT 5",
    gradeLabel: "四年级下",
    band: 2,
    vocabSize: 420,
    storyWordCount: [120, 190],
    maxSentenceWords: 10,
    maxNewWordRatio: 0.04,
    grammar: ["一般过去时(规则动词)", "and/but 并列句", "because 原因"],
  },
  {
    id: 7,
    name: "Breeze 微风",
    cefr: "A1",
    oxford: "ORT 6",
    gradeLabel: "五年级上",
    band: 3,
    vocabSize: 520,
    storyWordCount: [150, 230],
    maxSentenceWords: 11,
    maxNewWordRatio: 0.04,
    grammar: ["一般过去时(常见不规则动词)", "will 将来时", "副词修饰"],
  },
  {
    id: 8,
    name: "Stream 溪流",
    cefr: "A1+",
    oxford: "ORT 6-7",
    gradeLabel: "五年级",
    band: 3,
    vocabSize: 660,
    storyWordCount: [180, 270],
    maxSentenceWords: 12,
    maxNewWordRatio: 0.035,
    grammar: ["be going to", "情态动词 should/must", "when 时间状语从句(简单)"],
  },
  {
    id: 9,
    name: "River 江河",
    cefr: "A2-",
    oxford: "ORT 7",
    gradeLabel: "五年级下",
    band: 3,
    vocabSize: 820,
    storyWordCount: [220, 320],
    maxSentenceWords: 13,
    maxNewWordRatio: 0.035,
    grammar: ["过去进行时", "动词不定式作目的", "比较级/最高级"],
  },
  {
    id: 10,
    name: "Hill 小山",
    cefr: "A2",
    oxford: "ORT 8",
    gradeLabel: "六年级上",
    band: 4,
    vocabSize: 1000,
    storyWordCount: [260, 380],
    maxSentenceWords: 14,
    maxNewWordRatio: 0.035,
    grammar: ["现在完成时(初步)", "if 条件句(真实)", "宾语从句(that)"],
  },
  {
    id: 11,
    name: "Peak 山峰",
    cefr: "A2",
    oxford: "ORT 9",
    gradeLabel: "六年级",
    band: 4,
    vocabSize: 1200,
    storyWordCount: [300, 440],
    maxSentenceWords: 15,
    maxNewWordRatio: 0.03,
    grammar: ["现在完成时", "used to", "关系从句 who/that(简单)"],
  },
  {
    id: 12,
    name: "Cloud 云端",
    cefr: "A2+",
    oxford: "ORT 9-10",
    gradeLabel: "六年级下 / 小升初",
    band: 4,
    vocabSize: 1450,
    storyWordCount: [350, 500],
    maxSentenceWords: 16,
    maxNewWordRatio: 0.03,
    grammar: ["被动语态(一般现在/过去)", "间接引语(初步)", "并列复合句"],
  },
  {
    id: 13,
    name: "Sky 天空",
    cefr: "B1-",
    oxford: "ORT 10-11",
    gradeLabel: "初一",
    band: 5,
    vocabSize: 1700,
    storyWordCount: [400, 580],
    maxSentenceWords: 18,
    maxNewWordRatio: 0.03,
    grammar: ["过去完成时(初步)", "定语从句", "虚拟语气(if I were)"],
  },
  {
    id: 14,
    name: "Star 星辰",
    cefr: "B1",
    oxford: "ORT 11-12",
    gradeLabel: "初一 / 初二",
    band: 5,
    vocabSize: 2000,
    storyWordCount: [450, 650],
    maxSentenceWords: 20,
    maxNewWordRatio: 0.025,
    grammar: ["各时态综合", "状语从句(although, while)", "动名词/不定式辨析"],
  },
  {
    id: 15,
    name: "Galaxy 星河",
    cefr: "B1",
    oxford: "ORT 12+",
    gradeLabel: "初二及以上",
    band: 5,
    vocabSize: 2400,
    storyWordCount: [500, 750],
    maxSentenceWords: 22,
    maxNewWordRatio: 0.025,
    grammar: ["不限(自然书面语)", "篇章衔接词", "多段落叙事"],
  },
];

export function getLevel(id: number): Level {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

/** 兴趣主题轨道(差异化卖点:孩子选主题,只看到自己主题轨道的故事) */
export const INTERESTS = [
  { key: "dinosaurs", label: "恐龙", emoji: "🦖" },
  { key: "soccer", label: "足球", emoji: "⚽" },
  { key: "princess", label: "公主与城堡", emoji: "👑" },
  { key: "space", label: "宇宙太空", emoji: "🚀" },
  { key: "animals", label: "动物朋友", emoji: "🐼" },
  { key: "magic", label: "魔法冒险", emoji: "✨" },
] as const;

export type InterestKey = (typeof INTERESTS)[number]["key"];
