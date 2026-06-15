/** 萌宠的 DB 胶水层:领养、当前状态(成长值/阶段)、读完后的进化检测。 */
import { prisma } from "./db";
import { getBadgeStats } from "./badges-store";
import { petScore, petStage, petProgress, getSpecies, petImage, SPECIES } from "./pet";

export async function getPet(childId: string) {
  return prisma.pet.findUnique({ where: { childId } });
}

/** 领养萌宠(一孩一宠;已有则直接返回)。初始阶段按当前累计学习,避免领养即连环"进化"。 */
export async function choosePet(childId: string, species: string) {
  if (!SPECIES.some((s) => s.key === species)) throw new Error("未知萌宠");
  const existing = await prisma.pet.findUnique({ where: { childId } });
  if (existing) return existing;
  const stage = petStage(petScore(await getBadgeStats(childId)));
  return prisma.pet.create({ data: { childId, species, stageSeen: stage } });
}

/** 当前萌宠状态(成长值/阶段/进度/当前形态图);无宠返回 null */
export async function getPetState(childId: string) {
  const pet = await prisma.pet.findUnique({ where: { childId } });
  if (!pet) return null;
  const score = petScore(await getBadgeStats(childId));
  const stage = petStage(score);
  const species = getSpecies(pet.species)!;
  return {
    pet,
    species,
    score,
    stage,
    stageName: species.stageNames[stage],
    image: petImage(pet.species, stage),
    progress: petProgress(score),
  };
}

/**
 * 读完一篇后检查进化:当前阶段超过已展示的最高阶段(stageSeen)则升级并返回进化信息(供结果页庆祝);
 * 否则 null。阶段只升不降。
 */
export async function checkPetEvolution(childId: string) {
  const pet = await prisma.pet.findUnique({ where: { childId } });
  if (!pet) return null;
  const stage = petStage(petScore(await getBadgeStats(childId)));
  if (stage <= pet.stageSeen) return null;
  await prisma.pet.update({ where: { id: pet.id }, data: { stageSeen: stage } });
  const species = getSpecies(pet.species)!;
  return {
    species: pet.species,
    stage,
    name: species.stageNames[stage],
    image: petImage(pet.species, stage),
  };
}
