/**
 * 输出所有 draft 故事的完整内容(供人工/编辑审读)。
 * 用法:npx tsx scripts/list-drafts.ts
 */

import { join } from "path";
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(join(__dirname, "..", ".env"));
} catch {
  /* 无 .env 时静默 */
}

const prisma = new PrismaClient();

prisma.story
  .findMany({ where: { status: "draft" }, orderBy: [{ levelId: "asc" }, { slug: "asc" }] })
  .then((rows) => {
    const out = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      levelId: r.levelId,
      interest: r.interest,
      title: r.title,
      wordCount: r.wordCount,
      text: r.text,
      glossary: JSON.parse(r.glossaryJson),
      questions: JSON.parse(r.questionsJson),
    }));
    console.log(JSON.stringify(out, null, 2));
    return prisma.$disconnect();
  });
