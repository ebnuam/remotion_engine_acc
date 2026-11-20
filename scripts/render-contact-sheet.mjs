#!/usr/bin/env node
/**
 * Contact Sheet Generator
 * Kok Iso Yo? Studio — Production Pipeline v2
 *
 * Renders keyframe stills using Remotion Swangle and tiles them into a single contact sheet image
 * with labeled frame numbers and timestamps using FFmpeg.
 *
 * Usage:
 *   node scripts/render-contact-sheet.mjs <CompositionId> <frames_comma_separated|auto> [output_path]
 *
 * Examples:
 *   node scripts/render-contact-sheet.mjs ShipEp1-Preview 60,240,470,960,1420,1920 output/sheet.png
 *   node scripts/render-contact-sheet.mjs ShipEp1-Preview auto output/sheet_auto.png
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

// 1. Parse CLI Arguments
const args = process.argv.slice(2);
const composition = args[0] || "ShipEp1-Preview";
const framesArg = args[1] || "auto";
const defaultOutputPath = path.join(
  ROOT_DIR,
  "output",
  `contact_sheet_${composition}_${Date.now()}.png`
);
const outputPath = path.resolve(ROOT_DIR, args[2] || defaultOutputPath);

console.log("==================================================");
console.log(" KOK ISO YO? STUDIO — CONTACT SHEET GENERATOR v2  ");
console.log("==================================================");
console.log(`Composition : ${composition}`);
console.log(`Output Path : ${outputPath}`);

// 2. Resolve Target Frames
let frames = [];

if (framesArg.toLowerCase() === "auto") {
  console.log("Auto-detecting composition duration for 6 keyframes...");
  let totalDuration = 2010; // Default fallback (67s @ 30fps)

  try {
    const stdout = execSync("npx remotion compositions", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const lines = stdout.split("\n");
    for (const line of lines) {
      if (line.includes(composition)) {
        const match = line.match(/(\d+)\s*\(\d+\.\d+\s*sec\)/);
        if (match) {
          totalDuration = parseInt(match[1], 10);
          break;
        }
      }
    }
  } catch {
    console.log(`Using fallback composition duration: ${totalDuration} frames`);
  }

  console.log(`Detected duration: ${totalDuration} frames (~${(totalDuration / 30).toFixed(1)}s)`);

  // Distribute 6 keyframes across the narrative arc
  frames = [
    Math.round(totalDuration * 0.05),
    Math.round(totalDuration * 0.22),
    Math.round(totalDuration * 0.42),
    Math.round(totalDuration * 0.62),
    Math.round(totalDuration * 0.80),
    Math.round(totalDuration * 0.96),
  ];
} else {
  frames = framesArg
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0);

  if (frames.length === 0) {
    console.error("Error: No valid frame numbers provided.");
    process.exit(1);
  }
}

console.log(`Target Frames (${frames.length}): [ ${frames.join(", ")} ]`);

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 3. Setup Temp Workspace
const tempDir = path.join(outputDir, `.temp_contact_sheet_${Date.now()}`);
fs.mkdirSync(tempDir, { recursive: true });

try {
  // 4. Render and Label Each Frame
  console.log("\n--- Phase 1: Rendering Still Frames ---");
  for (let idx = 0; idx < frames.length; idx++) {
    const f = frames[idx];
    const seqNum = String(idx + 1).padStart(2, "0");
    const rawFile = path.join(tempDir, `raw_${seqNum}.png`);
    const tileFile = path.join(tempDir, `tile_${seqNum}.png`);

    console.log(`[${idx + 1}/${frames.length}] Rendering frame ${f} (t=${(f / 30).toFixed(2)}s)...`);

    // Render still with Remotion CPU Swangle
    const renderCmd = `npx remotion still ${composition} "${rawFile}" --frame=${f} --gl=swangle --timeout=120000`;
    execSync(renderCmd, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "inherit"],
    });

    if (!fs.existsSync(rawFile)) {
      throw new Error(`Failed to render frame ${f}: output file not found.`);
    }

    // Burn frame label overlay with FFmpeg drawtext
    const labelText = `f=${f} (${(f / 30).toFixed(1)}s)`;
    const ffmpegLabelCmd = `ffmpeg -y -i "${rawFile}" -vf "drawtext=text='${labelText}':fontsize=32:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=8:x=20:y=20" -frames:v 1 -update 1 "${tileFile}"`;
    execSync(ffmpegLabelCmd, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "inherit"],
    });

    if (!fs.existsSync(tileFile)) {
      throw new Error(`Failed to label frame ${f}: labeled tile not created.`);
    }
  }

  // 5. Tile Frames into Single Contact Sheet
  console.log("\n--- Phase 2: Assembling Contact Sheet Grid ---");
  const count = frames.length;
  let cols = 3;
  let rows = 2;

  if (count <= 4) {
    cols = 2;
    rows = Math.ceil(count / cols);
  } else if (count <= 6) {
    cols = 3;
    rows = 2;
  } else if (count <= 8) {
    cols = 4;
    rows = 2;
  } else if (count <= 9) {
    cols = 3;
    rows = 3;
  } else {
    cols = 4;
    rows = Math.ceil(count / cols);
  }

  console.log(`Grid Layout: ${cols} columns x ${rows} rows for ${count} frames`);

  const ffmpegTileCmd = `ffmpeg -y -framerate 1 -start_number 1 -i "${tempDir}/tile_%02d.png" -vf "tile=${cols}x${rows}:margin=16:padding=12:color=0x0f172a" -frames:v 1 -update 1 "${outputPath}"`;
  execSync(ffmpegTileCmd, {
    cwd: ROOT_DIR,
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Failed to create contact sheet at ${outputPath}`);
  }

  const stats = fs.statSync(outputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log("\n==================================================");
  console.log(" ✓ CONTACT SHEET CREATED SUCCESSFULLY!            ");
  console.log("==================================================");
  console.log(`Path : ${outputPath}`);
  console.log(`Size : ${sizeMb} MB (${stats.size} bytes)`);
  console.log("Frames included:");
  frames.forEach((f, i) => {
    console.log(`  Tile ${i + 1}: Frame ${f} (${(f / 30).toFixed(2)}s)`);
  });
} finally {
  // 6. Clean up Temporary Working Directory
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (cleanErr) {
    console.warn(`Notice: Failed to clean temp dir: ${cleanErr.message}`);
  }
}
