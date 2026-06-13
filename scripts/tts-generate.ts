/**
 * TTS 预生成:为没有音频的已发布故事批量生成朗读 MP3。
 *
 * 用法:npx tsx scripts/tts-generate.ts
 *   - 配置了 AZURE_SPEECH_KEY → 用 Azure 神经语音(童声友好,按字符计费,预生成成本极低)
 *   - 没配置 → 跳过并提示;阅读器会自动回退浏览器 Web Speech(开发期足够)
 *
 * 音频写入 public/audio/<slug>.mp3 并回填 story.audioUrl。
 * 生产部署时应把 public/audio 同步到对象存储(COS/OSS)+ CDN。
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

// 独立脚本不经 Next.js,需显式加载 .env(Node 内置,无依赖)
try {
  process.loadEnvFile(join(__dirname, "..", ".env"));
} catch {
  /* 没有 .env 时静默跳过 */
}

const prisma = new PrismaClient();

const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? "eastasia";

// 按「年龄段(级别)」选朗读音色——不同年龄用不同声音。
// 注:童声 en-US-AnaNeural 不支持 mstts:express-as 风格,故其 style 为 null(不加风格标签)。
// (为什么用情感 TTS 而非声音克隆:见 docs/adr/0007)
const VOICE_BY_STAGE: { maxLevel: number; voice: string; style: string | null; note: string }[] = [
  {
    maxLevel: 12,
    voice: "en-US-AnaNeural",
    style: null,
    note: "小学(L1-12):童声,同龄亲切(用户 2026-06 定)",
  },
  // TODO(初中段音色):用户将另行选择,届时改这一行的 voice/style
  {
    maxLevel: 15,
    voice: "en-US-AvaMultilingualNeural",
    style: null,
    note: "初中(L13-15):暂用自然叙事音,待定",
  },
];

function voiceForLevel(levelId: number) {
  return (
    VOICE_BY_STAGE.find((s) => levelId <= s.maxLevel) ?? VOICE_BY_STAGE[VOICE_BY_STAGE.length - 1]
  );
}

/** 按级别调语速:低龄更慢、便于逐词跟读;高级别接近自然语速 */
function rateForLevel(levelId: number): string {
  if (levelId <= 4) return "-18%";
  if (levelId <= 9) return "-10%";
  return "-5%";
}

async function azureTts(
  text: string,
  voice: string,
  style: string | null,
  rate: string
): Promise<Buffer> {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const inner = `<prosody rate='${rate}'>${escaped}</prosody>`;
  // 支持风格的音色才包 express-as;童声等不支持的直接朗读
  const body = style
    ? `<mstts:express-as style='${style}' styledegree='1.6'>${inner}</mstts:express-as>`
    : inner;
  const ssml = `<speak version='1.0' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='${voice}'>${body}</voice></speak>`;
  const res = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!AZURE_KEY) {
    console.log("未配置 AZURE_SPEECH_KEY,跳过 TTS 预生成。");
    console.log("阅读器将回退浏览器 Web Speech 朗读(开发期可用,上线前请预生成)。");
    return;
  }

  const stories = await prisma.story.findMany({
    where: { status: "published", audioUrl: null },
  });
  console.log(`待生成音频: ${stories.length} 篇`);

  const audioDir = join(__dirname, "..", "public", "audio");
  mkdirSync(audioDir, { recursive: true });

  for (const story of stories) {
    // 名字槽位读成通用昵称(音频是全体共享的,不能按孩子定制)
    const text = story.text.replaceAll("{{name}}", "Sam");
    const stage = voiceForLevel(story.levelId);
    try {
      const mp3 = await azureTts(text, stage.voice, stage.style, rateForLevel(story.levelId));
      writeFileSync(join(audioDir, `${story.slug}.mp3`), mp3);
      await prisma.story.update({
        where: { id: story.id },
        data: { audioUrl: `/audio/${story.slug}.mp3` },
      });
      console.log(`✅ ${story.slug}  (${stage.voice})`);
    } catch (e) {
      console.log(`❌ ${story.slug}: ${e}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
