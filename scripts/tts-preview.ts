/**
 * 音色试听对比:同一段故事,用多个 Azure 音色×风格各生成一个 mp3,
 * 让你一次听完直接挑最顺耳的,再把选定值填进 .env 的 AZURE_TTS_VOICE / AZURE_TTS_STYLE。
 *
 * 用法:配好 AZURE_SPEECH_KEY 后 → npm run tts:preview
 * 输出:public/audio/_preview/<voice>__<style>.mp3(不进 git)
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? "eastasia";

// 一段有对话、有情绪起伏(sad → brave → joy)的样本,最能体现「情感朗读」的差异
const SAMPLE_TEXT =
  'Lily had a little star. The star was sad. "Do not cry," said Lily. ' +
  '"I will help you shine again." Lily looked up at the big, dark sky. ' +
  '"You can do it!" she said. Slowly, the little star began to glow. ' +
  'It grew brighter and brighter. "I did it!" the star sang. ' +
  'Lily smiled. "You were brave," she said. The whole sky was full of light.';

// 适合儿童英语故事的候选(温暖叙事女声为主;童声/多语自然音做对照)
const CANDIDATES: { voice: string; style: string | null; note: string }[] = [
  { voice: "en-US-JennyNeural", style: "friendly", note: "温暖亲切(当前默认)" },
  { voice: "en-US-JennyNeural", style: "cheerful", note: "更活泼" },
  { voice: "en-US-AriaNeural", style: "friendly", note: "清晰温暖" },
  { voice: "en-US-AriaNeural", style: "narration-professional", note: "专业叙事" },
  { voice: "en-US-AnaNeural", style: null, note: "童声(同龄感)" },
  { voice: "en-US-AvaMultilingualNeural", style: null, note: "非常自然" },
];

const RATE = "-12%";

function buildSsml(voice: string, style: string | null): string {
  const escaped = SAMPLE_TEXT.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const inner = `<prosody rate='${RATE}'>${escaped}</prosody>`;
  const body = style
    ? `<mstts:express-as style='${style}' styledegree='1.6'>${inner}</mstts:express-as>`
    : inner;
  return `<speak version='1.0' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='${voice}'>${body}</voice></speak>`;
}

async function synth(voice: string, style: string | null): Promise<Buffer> {
  const res = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_KEY!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    },
    body: buildSsml(voice, style),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!AZURE_KEY) {
    console.log("未配置 AZURE_SPEECH_KEY。请先在 .env 填好 key 再跑试听。");
    return;
  }
  const dir = join(__dirname, "..", "public", "audio", "_preview");
  mkdirSync(dir, { recursive: true });
  console.log("生成试听样本(同一段故事,不同音色×风格):\n");
  for (const c of CANDIDATES) {
    const tag = `${c.voice}__${c.style ?? "default"}`;
    try {
      const mp3 = await synth(c.voice, c.style);
      writeFileSync(join(dir, `${tag}.mp3`), mp3);
      console.log(`✅ ${tag}.mp3  —  ${c.note}`);
    } catch (e) {
      console.log(`❌ ${tag}  —  ${c.note}  (${e})`);
    }
  }
  console.log(`\n音频在 public/audio/_preview/。听完把选定的音色/风格填进 .env:`);
  console.log(`  AZURE_TTS_VOICE=<选定音色>`);
  console.log(`  AZURE_TTS_STYLE=<选定风格>   (若选童声 Ana,删掉这行)`);
  console.log(`再跑 npm run tts:generate 给全部故事生成正式音频。`);
}

main();
