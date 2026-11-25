import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const entry = path.join(ROOT_DIR, "src/index.ts");
const compositionId = "BadakEp2-Preview";

const frames = [
  { scene: "S01_Hook", frame: 120 },
  { scene: "S02_MapRelocation", frame: 660 },
  { scene: "S03_KrakatauTsunami", frame: 1060 },
  { scene: "S04_TruckTransport", frame: 1260 },
  { scene: "S05_MusofaMemorial", frame: 1720 },
  { scene: "S06_DistanceContrast", frame: 2020 },
  { scene: "S07_SavannaAdaptation", frame: 2200 },
  { scene: "S08_LangkapInvasion", frame: 2760 },
  { scene: "S09_RestoredJungleFamily", frame: 3280 },
  { scene: "S10_OutroSplitCTA", frame: 3500 },
];

console.log("Bundling webpack once...");
const bundleLocation = await bundle({
  entryPoint: entry,
  webpackOverride: (config) => config,
});

console.log("Selecting composition:", compositionId);
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
});

const tempDir = path.join(ROOT_DIR, "out/qc_tiles");
fs.mkdirSync(tempDir, { recursive: true });

console.log(`Rendering ${frames.length} keyframes...`);
for (let i = 0; i < frames.length; i++) {
  const item = frames[i];
  const seq = String(i + 1).padStart(2, "0");
  const rawFile = path.join(tempDir, `tile_${seq}.png`);

  console.log(`[${i + 1}/${frames.length}] Scene ${item.scene} @ frame ${item.frame}...`);
  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: rawFile,
    frame: item.frame,
    imageFormat: "png",
    gl: "angle",
  });

  // Label tile with drawtext
  const labelText = `${item.scene} (f=${item.frame})`;
  const labeledFile = path.join(tempDir, `labeled_${seq}.png`);
  execSync(
    `ffmpeg -y -i "${rawFile}" -vf "drawtext=text='${labelText}':fontsize=28:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=8:x=20:y=20" "${labeledFile}"`
  );
}

// Assemble into 5x2 contact sheet
const contactSheetPath = path.join(ROOT_DIR, "out/BadakEp2_ContactSheet_All10Scenes.png");
console.log("Assembling contact sheet into:", contactSheetPath);
execSync(
  `ffmpeg -y -framerate 1 -start_number 1 -i "${tempDir}/labeled_%02d.png" -vf "tile=5x2:margin=16:padding=12:color=0x0f172a" "${contactSheetPath}"`
);

console.log("✓ ALL 10 SCENES QC CONTACT SHEET CREATED SUCCESSFULLY!");
console.log("Output:", contactSheetPath);
