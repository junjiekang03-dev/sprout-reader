import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { parseGlossary, parseQuestions, renderWithName } from "@/lib/story-types";
import { Reader } from "./reader";

export default async function ReadPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story || story.status !== "published") notFound();

  // 选项随机打乱(种子数据答案集中在 A,不打乱孩子会学会“无脑选第一个”);
  // value 保留原始下标,服务端判分用
  const questions = parseQuestions(story.questionsJson).map((q) => ({
    prompt: renderWithName(q.prompt, child.nickname),
    options: q.options
      .map((o, i) => ({ text: renderWithName(o, child.nickname), value: i }))
      .sort(() => Math.random() - 0.5),
  }));

  return (
    <Reader
      storyId={story.id}
      title={renderWithName(story.title, child.nickname)}
      text={renderWithName(story.text, child.nickname)}
      glossary={parseGlossary(story.glossaryJson)}
      questions={questions}
      audioUrl={story.audioUrl}
      childName={child.nickname}
      interest={story.interest}
      slug={story.slug}
    />
  );
}
