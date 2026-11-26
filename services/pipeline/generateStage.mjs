/**
 * Pipeline Stage 1 — GENERATE (2-Route AI Router)
 *
 * - PREMIUM route (`agy` CLI on VPS, task="script_master"):
 *     Generates the master documentary script, hook, scene breakdown, and fact-check notes.
 * - STANDARD route (AGYBridge Render, task="post_copy"):
 *     Generates platform-optimized metadata & copy for YouTube Shorts, Facebook Reels, and Instagram Reels.
 */

import fs from "node:fs";
import path from "node:path";
import { AI_TIERS } from "../ai-gateway/index.mjs";

function extractJsonBlock(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function buildScriptMasterPrompt({ topic, slug, durationSec = 60, style = "Jalur 3C (StageDoc3D PBR + Editorial 2D)" }) {
  return [
    {
      role: "system",
      content:
        "Kamu adalah Creative Director & Penulis Naskah kanal edukasi sains & fakta 'Kok Iso Yo?'. " +
        "Balas HANYA dengan JSON valid tanpa penjelasan tambahan di luar JSON.",
    },
    {
      role: "user",
      content: `Buat master script video pendek vertikal 9:16 berdurasi ~${durationSec} detik.
Topik: ${topic}
Slug: ${slug}
Gaya Visual: ${style}

Format JSON wajib:
{
  "title": "Judul episode menarik (Bahasa Indonesia)",
  "hook": "Kalimat hook 3 detik pertama yang memancing rasa ingin tahu",
  "narrationScript": "Naskah voice-over utuh ~120-160 kata, bahasa Indonesia santai tapi akurat",
  "scenes": [
    {
      "id": "scene_01",
      "durationSec": 5,
      "narration": "Kalimat narasi scene ini",
      "visualCue": "Arahan visual 3D/2.5D dan elemen infografik",
      "cameraNote": "Gerakan kamera singkat"
    }
  ],
  "factCheckNotes": ["Poin verifikasi fakta 1", "Poin verifikasi fakta 2"]
}`,
    },
  ];
}

export function buildSocialPackPrompt({ topic, title, hook, narrationScript }) {
  return [
    {
      role: "system",
      content:
        "Kamu adalah Social Media Strategist untuk kanal edukasi 'Kok Iso Yo?' (YouTube Shorts, Facebook Reels, Instagram Reels). " +
        "Balas HANYA dengan JSON valid tanpa teks tambahan di luar JSON.",
    },
    {
      role: "user",
      content: `Buat paket copywriting multi-platform dari naskah berikut:
Topik: ${topic}
Judul: ${title}
Hook: ${hook}
Naskah: ${narrationScript}

Format JSON wajib:
{
  "youtube": {
    "title": "Judul YouTube Shorts maks 90 karakter + #Shorts",
    "description": "Deskripsi informatif 2-3 kalimat + CTA subscribe",
    "tags": ["kokisoyo", "edukasi", "sains", "shorts"],
    "categoryId": "27",
    "privacyStatus": "private"
  },
  "facebook": {
    "title": "Judul singkat Facebook Reels",
    "description": "Caption engaging untuk Facebook Reels + 3-5 hashtag relevan"
  },
  "instagram": {
    "caption": "Caption Instagram Reels menarik dengan line break rapi + 5-8 hashtag relevan",
    "firstComment": "Komentar pancingan diskusi untuk audience"
  }
}`,
    },
  ];
}

function renderScriptMarkdown(scriptData, meta) {
  const scenesMd = (scriptData.scenes || [])
    .map(
      (s, i) =>
        `### ${i + 1}. ${s.id || `scene_${String(i + 1).padStart(2, "0")}`} (${s.durationSec || 5}s)\n` +
        `- **Narasi:** ${s.narration || ""}\n` +
        `- **Visual:** ${s.visualCue || ""}\n` +
        `- **Kamera:** ${s.cameraNote || ""}\n`
    )
    .join("\n");

  const factsMd = (scriptData.factCheckNotes || []).map((f) => `- ${f}`).join("\n");

  return `# ${scriptData.title || meta.topic}

- **Slug:** \`${meta.slug}\`
- **Route Script (PREMIUM):** \`${meta.scriptRoute?.provider || "dry-run"}\` / \`${meta.scriptRoute?.model || "dry-run"}\`
- **Route Social Pack (STANDARD):** \`${meta.socialRoute?.provider || "dry-run"}\` / \`${meta.socialRoute?.model || "dry-run"}\`
- **Generated At:** ${meta.generatedAt}

## Hook (0–3s)
${scriptData.hook || ""}

## Master Voice-Over Script
${scriptData.narrationScript || ""}

## Scene Breakdown
${scenesMd}

## Fact-Check Notes
${factsMd}
`;
}

export async function runGenerateStage({
  router,
  jobDir,
  slug,
  topic,
  durationSec = 60,
  style = "Jalur 3C (StageDoc3D PBR + Editorial 2D)",
  dryRun = false,
  premiumModel = undefined,
  standardModel = undefined,
}) {
  if (!topic || !String(topic).trim()) {
    throw new Error("Generate stage requires a non-empty `topic`.");
  }

  fs.mkdirSync(jobDir, { recursive: true });
  const generatedAt = new Date().toISOString();

  if (dryRun) {
    const scriptData = {
      title: `[DRY-RUN] ${topic}`,
      hook: `Kok iso yo ${topic}?`,
      narrationScript: `Ini adalah naskah simulasi dry-run untuk topik ${topic}.`,
      scenes: [
        {
          id: "scene_01",
          durationSec: 5,
          narration: `Kok iso yo ${topic}?`,
          visualCue: "Establishing shot 3D + title badge",
          cameraNote: "Slow push-in",
        },
      ],
      factCheckNotes: ["Mode dry-run: belum memanggil AI provider."],
    };
    const socialPack = {
      youtube: {
        title: `${topic.slice(0, 75)} #Shorts`,
        description: `Simulasi deskripsi YouTube Shorts untuk ${topic}.`,
        tags: ["kokisoyo", "edukasi", "shorts"],
        categoryId: "27",
        privacyStatus: "private",
      },
      facebook: {
        title: topic.slice(0, 80),
        description: `Simulasi caption Facebook Reels untuk ${topic}. #KokIsoYo #Edukasi`,
      },
      instagram: {
        caption: `Simulasi caption Instagram Reels untuk ${topic}.\n\n#KokIsoYo #FaktaSains #Reels`,
        firstComment: "Menurut kalian fakta mana yang paling bikin kaget?",
      },
    };

    const scriptJsonPath = path.join(jobDir, "script_master.json");
    const scriptMdPath = path.join(jobDir, "script_master.md");
    const socialJsonPath = path.join(jobDir, "social_pack.json");

    fs.writeFileSync(scriptJsonPath, JSON.stringify(scriptData, null, 2), "utf8");
    fs.writeFileSync(
      scriptMdPath,
      renderScriptMarkdown(scriptData, { slug, topic, generatedAt }),
      "utf8"
    );
    fs.writeFileSync(socialJsonPath, JSON.stringify(socialPack, null, 2), "utf8");

    return {
      ok: true,
      dryRun: true,
      scriptData,
      socialPack,
      files: { scriptJsonPath, scriptMdPath, socialJsonPath },
      routes: {
        script: { tier: AI_TIERS.PREMIUM, provider: "dry-run", model: premiumModel || "dry-run" },
        social: { tier: AI_TIERS.STANDARD, provider: "dry-run", model: standardModel || "dry-run" },
      },
      usage: { totalTokens: 0 },
    };
  }

  // 1. PREMIUM route: Master Script & Storyboard Breakdown
  const scriptRes = await router.chatCompletion({
    task: "script_master",
    model: premiumModel,
    messages: buildScriptMasterPrompt({ topic, slug, durationSec, style }),
  });

  const parsedScript = extractJsonBlock(scriptRes.content) || {
    title: topic,
    hook: "",
    narrationScript: scriptRes.content,
    scenes: [],
    factCheckNotes: [],
  };

  // 2. STANDARD route: Multi-platform Social Pack (YT, FB, IG)
  const socialRes = await router.chatCompletion({
    task: "post_copy",
    model: standardModel,
    messages: buildSocialPackPrompt({
      topic,
      title: parsedScript.title || topic,
      hook: parsedScript.hook || "",
      narrationScript: parsedScript.narrationScript || scriptRes.content,
    }),
  });

  const parsedSocial = extractJsonBlock(socialRes.content) || {
    youtube: {
      title: `${(parsedScript.title || topic).slice(0, 80)} #Shorts`,
      description: socialRes.content.slice(0, 500),
      tags: ["kokisoyo", "edukasi", "shorts"],
      categoryId: "27",
      privacyStatus: "private",
    },
    facebook: {
      title: (parsedScript.title || topic).slice(0, 80),
      description: socialRes.content.slice(0, 500),
    },
    instagram: {
      caption: socialRes.content.slice(0, 1000),
      firstComment: "",
    },
  };

  const scriptJsonPath = path.join(jobDir, "script_master.json");
  const scriptMdPath = path.join(jobDir, "script_master.md");
  const socialJsonPath = path.join(jobDir, "social_pack.json");

  fs.writeFileSync(scriptJsonPath, JSON.stringify(parsedScript, null, 2), "utf8");
  fs.writeFileSync(
    scriptMdPath,
    renderScriptMarkdown(parsedScript, {
      slug,
      topic,
      generatedAt,
      scriptRoute: scriptRes.route,
      socialRoute: socialRes.route,
    }),
    "utf8"
  );
  fs.writeFileSync(socialJsonPath, JSON.stringify(parsedSocial, null, 2), "utf8");

  return {
    ok: true,
    dryRun: false,
    scriptData: parsedScript,
    socialPack: parsedSocial,
    files: { scriptJsonPath, scriptMdPath, socialJsonPath },
    routes: {
      script: scriptRes.route,
      social: socialRes.route,
    },
    usage: {
      scriptTokens: scriptRes.usage?.totalTokens || 0,
      socialTokens: socialRes.usage?.totalTokens || 0,
      totalTokens:
        (scriptRes.usage?.totalTokens || 0) + (socialRes.usage?.totalTokens || 0),
    },
  };
}
