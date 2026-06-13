/**
 * 从数据库删除指定 slug 的故事(用于「重命名 slug / 退役旧内容」时清理孤儿行)。
 * 用法:npx tsx scripts/delete-stories.ts <slug...>
 *
 * 注意:只删数据库行,不删 content/stories/ 文件。
 * 关联的 Reading 记录会按 schema 的 onDelete: Cascade 一并删除,
 * 所以只对「从未发布、从未被阅读」的退役内容使用,或确认无打卡记录后再用。
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

if (slugs.length === 0) {
  console.error("用法:npx tsx scripts/delete-stories.ts <slug...>");
  process.exit(1);
}

(async () => {
  for (const slug of slugs) {
    const r = await prisma.story.deleteMany({ where: { slug } });
    console.log(r.count > 0 ? `🗑️  已删除 ${slug}(${r.count} 行)` : `⚠️  未找到 ${slug}`);
  }
  await prisma.$disconnect();
})();
