import { prisma } from "@/lib/db";
import { getLevel, INTERESTS } from "@/lib/levels";
import { parseGlossary, parseQuestions, renderWithName } from "@/lib/story-types";
import { publishStory, rejectStory } from "@/app/actions/admin";

/**
 * 内容审核台(管线第 3 层:人工通读)。
 * 访问 /admin?key=<ADMIN_KEY> 才能看到草稿。
 * 列出所有 draft 故事,人工通读后「发布」或「退回」。
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const authed = !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;

  if (!authed) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-bold">内容审核台</h1>
        <p className="mt-3 text-sm text-muted">
          请通过 <code className="rounded bg-primary-soft px-1">/admin?key=管理密钥</code> 访问。
        </p>
      </main>
    );
  }

  const drafts = await prisma.story.findMany({
    where: { status: "draft" },
    orderBy: [{ levelId: "asc" }, { createdAt: "asc" }],
  });
  const publishedCount = await prisma.story.count({ where: { status: "published" } });

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">内容审核台</h1>
        <p className="mt-1 text-sm text-muted">
          待通读发布 <b className="text-primary-ink">{drafts.length}</b> 篇 · 已发布{" "}
          {publishedCount} 篇。AI 生成 + 程序校验 + 安全审核已过,最后一道是你的人工通读。
        </p>
      </header>

      {drafts.length === 0 && (
        <p className="rounded-xl bg-card p-6 text-center text-faint shadow-card">
          没有待审核的草稿 🎉
        </p>
      )}

      <div className="space-y-6">
        {drafts.map((s) => {
          const level = getLevel(s.levelId);
          const interest = INTERESTS.find((i) => i.key === s.interest);
          const text = renderWithName(s.text, "Sam");
          const glossary = parseGlossary(s.glossaryJson);
          const questions = parseQuestions(s.questionsJson);
          return (
            <article key={s.id} className="rounded-card bg-card p-6 shadow-card">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold">{renderWithName(s.title, "Sam")}</h2>
                <span className="text-xs text-faint">
                  L{s.levelId} {level.name} · {interest?.emoji} {interest?.label} · {s.wordCount} 词
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed">{text}</p>

              {glossary.length > 0 && (
                <p className="mt-3 text-sm text-muted">
                  生词:
                  {glossary.map((g) => `${g.word}(${g.zh})`).join("、")}
                </p>
              )}

              <ol className="mt-3 space-y-1 text-sm text-muted">
                {questions.map((q, i) => (
                  <li key={i}>
                    {i + 1}. {renderWithName(q.prompt, "Sam")} —{" "}
                    <b>{renderWithName(q.options[q.answer], "Sam")}</b>
                  </li>
                ))}
              </ol>

              <div className="mt-5 flex gap-3">
                <form action={publishStory}>
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="storyId" value={s.id} />
                  <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white active:scale-[0.98]">
                    ✓ 发布
                  </button>
                </form>
                <form action={rejectStory}>
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="storyId" value={s.id} />
                  <button className="rounded-xl border border-line px-6 py-2.5 text-sm text-muted active:scale-[0.98]">
                    退回
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
