/** Story JSON 字段的解析与类型(SQLite 不支持 Json 标量,统一 String 存储) */

export interface GlossaryEntry {
  word: string;
  zh: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  /** 正确选项下标 */
  answer: number;
}

export function parseGlossary(json: string): GlossaryEntry[] {
  try {
    return JSON.parse(json) as GlossaryEntry[];
  } catch {
    return [];
  }
}

export function parseQuestions(json: string): QuizQuestion[] {
  try {
    return JSON.parse(json) as QuizQuestion[];
  } catch {
    return [];
  }
}

export function parseInterests(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

/** 名字槽位替换:{{name}} → 孩子英文名/昵称(确定性替换,不产生新 AI 内容) */
export function renderWithName(text: string, name: string): string {
  return text.replaceAll("{{name}}", name);
}

/** 本地日期键(打卡聚合用,东八区语义:直接用服务器本地时区) */
export function dateKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
