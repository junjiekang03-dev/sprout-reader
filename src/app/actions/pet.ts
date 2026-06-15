"use server";

import { redirect } from "next/navigation";
import { getSessionParent, getActiveChild } from "@/lib/session";
import { choosePet } from "@/lib/pet-store";

/** 领养萌宠(选择页表单提交)。成功后进萌宠页。 */
export async function choosePetAction(formData: FormData) {
  const species = String(formData.get("species") || "");
  const parent = await getSessionParent();
  if (!parent) redirect("/login");
  const child = await getActiveChild(parent.children);
  if (!child) redirect("/onboarding");
  await choosePet(child.id, species);
  redirect("/pet");
}
