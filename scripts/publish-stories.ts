/**
 * 把指定 slug 的故事设为 published(内容管线第 3 层「人工通读后发布」的批量执行)。
 * 用法:npx tsx scripts/publish-stories.ts <slug1> <slug2> ...
 */

import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(join(__dirname, "..", ".env"));
} catch {
  /* 无 .env 时静默 */
}

const prisma = new PrismaClient();
const STORIES_DIR = join(__dirname, "..", "content", "stories");
const slugs = process.argv.slice(2);

if (slugs.length === 0) {
  console.error("用法:npx tsx scripts/publish-stories.ts <slug...>");
  process.exit(1);
}

(async () => {
  for (const slug of slugs) {
    const r = await prisma.story.updateMany({ where: { slug }, data: { status: "published" } });
    // 同步回写 JSON 源文件的 status,否则全新环境 db:seed 会把它当 draft 导入(部署隐患)
    const file = join(STORIES_DIR, `${slug}.json`);
    if (existsSync(file)) {
      const data = JSON.parse(readFileSync(file, "utf-8"));
      if (data.status !== "published") {
        data.status = "published";
        writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
      }
    }
    console.log(r.count > 0 ? `✅ 已发布 ${slug}` : `⚠️ 未找到 ${slug}`);
  }
  await prisma.$disconnect();
})();
