#!/usr/bin/env node
/**
 * Kok Iso Yo? Studio — Multi-Still Renderer (Linux VPS Adapted)
 * Adapted from cartoon-3d-short templates/scripts/bridge-stills.mjs.
 *
 * - Bundles once with @remotion/bundler, renders keyframe stills cleanly.
 * - Supports Linux Chromium / Remotion chrome-headless-shell (no Windows paths).
 * - Supports arbitrary Composition ID, entry file, GL backend, and external output dirs.
 * - Includes --help and --dry-run (validation only, zero render).
 */

import fs from "node:fs";
import path from "node:path";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const HELP = `Usage:
  node scripts/kokisoyo-qa/bridge-stills.mjs --comp <CompositionId> --frames <f1,f2,...> [options]

Options:
  --comp <id>          Remotion composition ID (or env COMP_ID). Required.
  --frames <list>      Comma-separated frame numbers (e.g. 0,60,120). Required.
  --out-dir <dir>      Output directory (default: /tmp/kokisoyo-stills)
  --prefix <name>      Filename prefix inside --out-dir (default: frame_)
  --scale <number>     Scale factor (default: 0.5)
  --format <fmt>       Image format: jpeg | png (default: jpeg)
  --quality <1-100>    JPEG quality (default: 88)
  --entry <path>       Remotion entry file (or env BRIDGE_ENTRY, default: src/index.ts)
  --public-dir <path>  Public directory (default: public)
  --gl <backend>       GL backend: swangle | angle | swiftshader | egl | vulkan (or env GL_BACKEND, default: swangle)
  --mode <name>        Optional Stage25D post.mode inputProp: draft | look | final
  --props <json>       Optional JSON inputProps passed to selectComposition/renderStill
  --browser <path>     Chromium executable path (or env REMOTION_BROWSER_EXECUTABLE; auto-detected if omitted)
  --timeout <ms>       Per-frame timeout ms (default: 180000)
  --dry-run            Validate config and print resolved command without bundling or rendering
  -h, --help           Show this help message
`;

function parseArgs(argv) {
  const opts = {
    comp: process.env.COMP_ID || "",
    frames: "",
    outDir: "/tmp/kokisoyo-stills",
    prefix: "frame_",
    scale: 0.5,
    format: "jpeg",
    quality: 88,
    entry: process.env.BRIDGE_ENTRY || "src/index.ts",
    publicDir: "public",
    gl: process.env.GL_BACKEND || "swangle",
    mode: "",
    propsJson: "",
    browser: process.env.REMOTION_BROWSER_EXECUTABLE || "",
    timeout: 180000,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      opts.help = true;
    } else if (a === "--dry-run") {
      opts.dryRun = true;
    } else if (a === "--comp" && i + 1 < argv.length) {
      opts.comp = argv[++i];
    } else if (a === "--frames" && i + 1 < argv.length) {
      opts.frames = argv[++i];
    } else if (a === "--out-dir" && i + 1 < argv.length) {
      opts.outDir = argv[++i];
    } else if (a === "--prefix" && i + 1 < argv.length) {
      opts.prefix = argv[++i];
    } else if (a === "--scale" && i + 1 < argv.length) {
      opts.scale = Number(argv[++i]);
    } else if (a === "--format" && i + 1 < argv.length) {
      opts.format = argv[++i];
    } else if (a === "--quality" && i + 1 < argv.length) {
      opts.quality = Number(argv[++i]);
    } else if (a === "--entry" && i + 1 < argv.length) {
      opts.entry = argv[++i];
    } else if (a === "--public-dir" && i + 1 < argv.length) {
      opts.publicDir = argv[++i];
    } else if (a === "--gl" && i + 1 < argv.length) {
      opts.gl = argv[++i];
    } else if (a === "--mode" && i + 1 < argv.length) {
      opts.mode = argv[++i];
    } else if (a === "--props" && i + 1 < argv.length) {
      opts.propsJson = argv[++i];
    } else if (a === "--browser" && i + 1 < argv.length) {
      opts.browser = argv[++i];
    } else if (a === "--timeout" && i + 1 < argv.length) {
      opts.timeout = Number(argv[++i]);
    } else {
      throw new Error(`Unknown or incomplete argument: ${a}`);
    }
  }
  return opts;
}

function detectLinuxBrowser(explicitPath) {
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) {
      throw new Error(`Specified browser executable not found: ${explicitPath}`);
    }
    return explicitPath;
  }
  const bundled = path.resolve(
    "node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell"
  );
  if (fs.existsSync(bundled)) {
    return null; // Let Remotion use its bundled chrome-headless-shell natively
  }
  const candidates = ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/snap/bin/chromium", "/usr/bin/google-chrome"];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function validate(opts) {
  if (!opts.comp.trim()) {
    throw new Error("Missing composition ID. Pass --comp <CompositionId> or set COMP_ID.");
  }
  if (!opts.frames.trim()) {
    throw new Error("Missing frames list. Pass --frames <f1,f2,...>.");
  }
  const parsedFrames = opts.frames.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
  if (parsedFrames.length === 0 || parsedFrames.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Invalid frames list: "${opts.frames}". Expected comma-separated non-negative integers.`);
  }
  if (!Number.isFinite(opts.scale) || opts.scale <= 0 || opts.scale > 4) {
    throw new Error(`Invalid --scale value: ${opts.scale}`);
  }
  if (!["jpeg", "png"].includes(opts.format)) {
    throw new Error(`Invalid --format: ${opts.format}. Allowed: jpeg, png`);
  }
  const allowedGl = ["swangle", "angle", "swiftshader", "egl", "vulkan"];
  if (!allowedGl.includes(opts.gl)) {
    throw new Error(`Invalid --gl backend: ${opts.gl}. Allowed: ${allowedGl.join(", ")}`);
  }
  const entryAbs = path.resolve(opts.entry);
  if (!fs.existsSync(entryAbs)) {
    throw new Error(`Entry file not found: ${entryAbs}`);
  }
  const publicAbs = path.resolve(opts.publicDir);
  if (!fs.existsSync(publicAbs)) {
    throw new Error(`Public directory not found: ${publicAbs}`);
  }
  const allowedModes = ["draft", "look", "final"];
  if (opts.mode && !allowedModes.includes(opts.mode)) {
    throw new Error(`Invalid --mode: ${opts.mode}. Allowed: ${allowedModes.join(", ")}`);
  }
  let inputProps = {};
  if (opts.propsJson) {
    inputProps = JSON.parse(opts.propsJson);
  }
  if (opts.mode) {
    inputProps = { ...inputProps, post: { ...(inputProps.post || {}), mode: opts.mode } };
  }
  const hasInputProps = Object.keys(inputProps).length > 0;
  const browserExecutable = detectLinuxBrowser(opts.browser);
  return {
    ...opts,
    parsedFrames,
    entryAbs,
    publicAbs,
    outDirAbs: path.resolve(opts.outDir),
    browserExecutable,
    inputProps: hasInputProps ? inputProps : undefined,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const cfg = validate(opts);
  const ext = cfg.format === "png" ? "png" : "jpg";
  const plannedFiles = cfg.parsedFrames.map((f) => path.join(cfg.outDirAbs, `${cfg.prefix}${f}.${ext}`));

  if (cfg.dryRun) {
    const summary = {
      mode: "dry-run",
      compositionId: cfg.comp,
      entryPoint: cfg.entryAbs,
      publicDir: cfg.publicAbs,
      outDir: cfg.outDirAbs,
      gl: cfg.gl,
      scale: cfg.scale,
      format: cfg.format,
      quality: cfg.format === "jpeg" ? cfg.quality : undefined,
      inputProps: cfg.inputProps || null,
      browserExecutable: cfg.browserExecutable || "remotion-bundled-chrome-headless-shell",
      remotionTmp: process.env.REMOTION_TMP || null,
      frames: cfg.parsedFrames,
      plannedOutputs: plannedFiles,
      equivalentCommands: cfg.parsedFrames.map(
        (f, i) =>
          `npx remotion still ${cfg.entryAbs} ${cfg.comp} "${plannedFiles[i]}" --frame=${f} --scale=${cfg.scale} --image-format=${cfg.format} --gl=${cfg.gl} --timeout=${cfg.timeout}`
      ),
    };
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
    process.exit(0);
  }

  fs.mkdirSync(cfg.outDirAbs, { recursive: true });
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");

  const chromiumOptions = { gl: cfg.gl };
  const serveUrl = await bundle({
    entryPoint: cfg.entryAbs,
    publicDir: cfg.publicAbs,
  });

  const selectOpts = {
    serveUrl,
    id: cfg.comp,
    chromiumOptions,
    ...(cfg.inputProps ? { inputProps: cfg.inputProps } : {}),
    ...(cfg.browserExecutable ? { browserExecutable: cfg.browserExecutable } : {}),
  };
  const composition = await selectComposition(selectOpts);

  const onBrowserLog = (l) => {
    if (l.type === "error" || l.type === "warning") {
      console.log(`[${l.type}]`, l.text.slice(0, 300));
    }
  };

  for (let i = 0; i < cfg.parsedFrames.length; i++) {
    const f = cfg.parsedFrames[i];
    const outFile = plannedFiles[i];
    const t0 = Date.now();
    await renderStill({
      composition,
      serveUrl,
      frame: f,
      output: outFile,
      ...(cfg.inputProps ? { inputProps: cfg.inputProps } : {}),
      imageFormat: cfg.format,
      ...(cfg.format === "jpeg" ? { jpegQuality: cfg.quality } : {}),
      scale: cfg.scale,
      chromiumOptions,
      ...(cfg.browserExecutable ? { browserExecutable: cfg.browserExecutable } : {}),
      timeoutInMilliseconds: cfg.timeout,
      onBrowserLog,
    });
    console.log("still", f, "->", outFile, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message || err);
  process.exit(1);
});
