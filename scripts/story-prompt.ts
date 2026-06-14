/**
 * 打印「故事生成 prompt」供人工粘贴给模型(内容管线第 1 层,手动路径)。
 * 自动化路径见 scripts/generate-content.ts(直连 Claude API)。
 *
 * 用法:npx tsx scripts/story-prompt.ts <levelId> <interestKey> [数量]
 * 例如:npx tsx scripts/story-prompt.ts 3 dinosaurs 5
 */

import { join } from "path";
import { INTERESTS } from "../src/lib/levels";
import { buildStoryPrompt } from "../src/lib/story-prompt-builder";

const levelId = Number(process.argv[2] ?? 3);
const interestKey = process.argv[3] ?? "dinosaurs";
const count = Number(process.argv[4] ?? 3);

if (!INTERESTS.find((i) => i.key === interestKey)) {
  console.error(`未知兴趣主题: ${interestKey}(可选: ${INTERESTS.map((i) => i.key).join(", ")})`);
  process.exit(1);
}

console.log(
  buildStoryPrompt({
    levelId,
    interest: interestKey,
    count,
    storiesDir: join(__dirname, "..", "content", "stories"),
    mode: "cli",
  })
);
