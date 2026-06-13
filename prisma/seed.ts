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
import { dateKeyOf } from "../src/lib/story-types";

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
        // 新生成的故事默认入 draft,等人工通读后在 /admin 发布
        status: story.status ?? "published",
      },
      // 注意:update 不触碰 status,避免把人工已发布的故事重新 seed 打回 draft
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
  let demoChild = await prisma.child.findFirst({ where: { parentId: demo.id } });
  if (!demoChild) {
    demoChild = await prisma.child.create({
      data: {
        parentId: demo.id,
        nickname: "Leo",
        levelId: 3,
        interests: JSON.stringify(["dinosaurs", "space"]),
        placementDone: true,
      },
    });
  } else {
    // 重置演示状态,让升级建议每次 seed 后都可重现
    demoChild = await prisma.child.update({
      where: { id: demoChild.id },
      data: { levelId: 3, placementDone: true },
    });
  }

  // 给演示账号补齐过去 5 天的 L3 高分阅读(幂等),
  // 让登录后能直接看到「连续打卡」与「升级建议」两个功能。
  const l3Stories = await prisma.story.findMany({ where: { levelId: 3 }, take: 3 });
  if (l3Stories.length >= 3) {
    const plan = [
      { storyIdx: 0, daysAgo: 5, correct: 3 },
      { storyIdx: 1, daysAgo: 4, correct: 3 },
      { storyIdx: 2, daysAgo: 3, correct: 2 },
      { storyIdx: 0, daysAgo: 2, correct: 3 },
      { storyIdx: 1, daysAgo: 1, correct: 3 },
    ];
    for (const p of plan) {
      const d = new Date();
      d.setDate(d.getDate() - p.daysAgo);
      const dateKey = dateKeyOf(d);
      const s = l3Stories[p.storyIdx];
      await prisma.reading.upsert({
        where: {
          childId_storyId_dateKey: { childId: demoChild.id, storyId: s.id, dateKey },
        },
        create: {
          childId: demoChild.id,
          storyId: s.id,
          dateKey,
          correctCount: p.correct,
          totalCount: 3,
          durationSec: 300,
        },
        update: { correctCount: p.correct, totalCount: 3 },
      });
    }
  }
  console.log("演示账号就绪:13800138000 / demo1234(孩子 Leo,L3,恐龙+太空,含升级建议演示数据)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
