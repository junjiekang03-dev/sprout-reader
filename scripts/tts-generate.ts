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

const prisma = new PrismaClient();

const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? "eastasia";
/** 美音童声叙事;可换 en-US-AnaNeural(儿童音)做 A/B */
const VOICE = "en-US-JennyNeural";

async function azureTts(text: string): Promise<Buffer> {
  const ssml = `<speak version='1.0' xml:lang='en-US'>
  <voice name='${VOICE}'>
    <prosody rate='-15%'>${text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")}</prosody>
  </voice>
</speak>`;
  const res = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY!,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );
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
    try {
      const mp3 = await azureTts(text);
      writeFileSync(join(audioDir, `${story.slug}.mp3`), mp3);
      await prisma.story.update({
        where: { id: story.id },
        data: { audioUrl: `/audio/${story.slug}.mp3` },
      });
      console.log(`✅ ${story.slug}`);
    } catch (e) {
      console.log(`❌ ${story.slug}: ${e}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
