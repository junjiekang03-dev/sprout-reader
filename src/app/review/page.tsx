import { redirect } from "next/navigation";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { getDueWords } from "@/lib/wordbook";
import { ReviewSession } from "./review-session";

export default async function ReviewPage() {
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");

  const due = await getDueWords(child.id);
  return <ReviewSession words={due.map((w) => ({ word: w.word, zh: w.zh }))} />;
}
