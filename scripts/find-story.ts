/**
 * 按 slug 查故事的关键状态(运营/排查用)。
 * 用法:npx tsx scripts/find-story.ts <slug...>
 */

import { join } from "path";
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(join(__dirname, "..", ".env"));
} catch {
  /* 无 .env 时静默 */
}

const prisma = new PrismaClient();
const slugs = process.argv.slice(2);

Promise.all(slugs.map((s) => prisma.story.findUnique({ where: { slug: s } }))).then((rows) => {
  for (const s of rows) {
    if (!s) continue;
    console.log(
      JSON.stringify({
        slug: s.slug,
        id: s.id,
        status: s.status,
        audioUrl: s.audioUrl,
        // 主角性别代词残留检查(中性化后应为 false)
        hasGenderedPronoun: /\b(she|her|herself|he|him|his)\b/i.test(s.text),
      })
    );
  }
  return prisma.$disconnect();
});
