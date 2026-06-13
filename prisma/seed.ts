/**
 * Seed:把 content/stories/*.json 校验后导入数据库(upsert,按 slug 幂等)。
 * 用法:npm run db:seed
 *
 * 注意:这里会再跑一遍分级校验,校验失败的故事直接拒绝入库——
 * 即使有人跳过 validate:stories 手动塞文件也过不了这道门。
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { validateStory, countWords, type StoryInput } from "../src/lib/vocab-check";

const prisma = new PrismaClient();
const STORIES_DIR = join(__dirname, "..", "content", "stories");

async function main() {
  const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".json"));
  let imported = 0;
  let rejected = 0;

  for (const file of files) {
    const story = JSON.parse(readFileSync(join(STORIES_DIR, file), "utf-8")) as StoryInput;
    const result = validateStory(story);
    if (!result.ok) {
      rejected++;
      console.log(`❌ 拒绝入库 ${file}:\n   ${result.errors.join("\n   ")}`);
      continue;
    }
    await prisma.story.upsert({
      where: { slug: story.slug },
      create: {
        slug: story.slug,
        title: story.title,
        levelId: story.levelId,
        interest: story.interest,
        wordCount: countWords(story.text),
        text: story.text,
        glossaryJson: JSON.stringify(story.glossary),
        questionsJson: JSON.stringify(story.questions),
        status: "published",
      },
      update: {
        title: story.title,
        levelId: story.levelId,
        interest: story.interest,
        wordCount: countWords(story.text),
        text: story.text,
        glossaryJson: JSON.stringify(story.glossary),
        questionsJson: JSON.stringify(story.questions),
      },
    });
    imported++;
  }
  console.log(`故事导入完成:成功 ${imported},拒绝 ${rejected}`);

  // 开发用演示账号(手机号 13800138000 / 密码 demo1234)
  const demo = await prisma.parent.upsert({
    where: { phone: "13800138000" },
    create: { phone: "13800138000", passwordHash: hashSync("demo1234", 10) },
    update: {},
  });
  const existingChild = await prisma.child.findFirst({ where: { parentId: demo.id } });
  if (!existingChild) {
    await prisma.child.create({
      data: {
        parentId: demo.id,
        nickname: "Leo",
        levelId: 3,
        interests: JSON.stringify(["dinosaurs", "space"]),
        placementDone: true,
      },
    });
  }
  console.log("演示账号就绪:13800138000 / demo1234(孩子 Leo,L3,恐龙+太空)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
