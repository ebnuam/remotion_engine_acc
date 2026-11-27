// Procedural architectural & marine engineering textures for Ep003: Jembatan Laut (Cofferdam).
// Grounded, weathered concrete (panel seams + tie-rod pin dots), corrugated sheet-pile steel,
// marine hull steel, asphalt deck with curbs/stripes, and seabed/bedrock strata.

import * as THREE from "three";
import { ctex, rng } from "../shared/kokisoyo25d";

/** Weathered architectural concrete with formwork panel seams & tie-rod dots (ref_003 / ref_009 aesthetic). */
export function concreteArchitecturalTex(key = "ep3_concrete_arch"): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    const r = rng(4011);
    g.fillStyle = "#d5cdbb";
    g.fillRect(0, 0, w, h);

    // Subtle concrete aggregate & vertical weathering streaks
    for (let i = 0; i < 900; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 2 + r() * 8;
      g.fillStyle = r() > 0.5 ? "rgba(120,112,98,0.06)" : "rgba(255,250,240,0.06)";
      g.fillRect(x, y, s, s * (1 + r() * 2.5));
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = "rgba(92,85,74,0.07)";
      g.fillRect(x, y, 2 + r() * 4, 24 + r() * 90);
    }

    // Formwork panel grid seams (2 cols x 4 rows per tile)
    const cols = 2;
    const rows = 4;
    const cw = w / cols;
    const ch = h / rows;

    g.strokeStyle = "rgba(72,66,58,0.34)";
    g.lineWidth = 2;
    for (let c = 0; c <= cols; c++) {
      g.beginPath();
      g.moveTo(c * cw, 0);
      g.lineTo(c * cw, h);
      g.stroke();
    }
    for (let row = 0; row <= rows; row++) {
      g.beginPath();
      g.moveTo(0, row * ch);
      g.lineTo(w, row * ch);
      g.stroke();
    }

    // Formwork tie-rod pin dots inside each concrete panel
    for (let c = 0; c < cols; c++) {
      for (let row = 0; row < rows; row++) {
        const x0 = c * cw;
        const y0 = row * ch;
        const pins: [number, number][] = [
          [x0 + cw * 0.25, y0 + ch * 0.3],
          [x0 + cw * 0.75, y0 + ch * 0.3],
          [x0 + cw * 0.25, y0 + ch * 0.72],
          [x0 + cw * 0.75, y0 + ch * 0.72],
        ];
        for (const [px, py] of pins) {
          g.fillStyle = "rgba(62,56,48,0.48)";
          g.beginPath();
          g.arc(px, py, 3.2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "rgba(250,246,236,0.32)";
          g.beginPath();
          g.arc(px - 1, py - 1, 1.5, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Corrugated industrial dark steel sheet-pile texture with subtle marine rust patina. */
export function sheetPileSteelTex(key = "ep3_sheet_pile"): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    const r = rng(5102);
    g.fillStyle = "#535d68";
    g.fillRect(0, 0, w, h);

    // Corrugated vertical ribs (light/shadow stripes)
    const ribs = 4;
    const rw = w / ribs;
    for (let i = 0; i < ribs; i++) {
      const x = i * rw;
      const gr = g.createLinearGradient(x, 0, x + rw, 0);
      gr.addColorStop(0.0, "#3a434d");
      gr.addColorStop(0.22, "#67727f");
      gr.addColorStop(0.45, "#596470");
      gr.addColorStop(0.72, "#353d46");
      gr.addColorStop(1.0, "#4e5863");
      g.fillStyle = gr;
      g.fillRect(x, 0, rw, h);

      // Interlock groove seam
      g.fillStyle = "#222830";
      g.fillRect(x, 0, 3, h);
    }

    // Subtle marine oxidation / waterline rust bands
    for (let i = 0; i < 160; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = r() > 0.35 ? "rgba(130,78,48,0.16)" : "rgba(40,48,56,0.18)";
      g.fillRect(x, y, 4 + r() * 14, 10 + r() * 44);
    }
    // Horizontal marine tide stains
    const tide = g.createLinearGradient(0, h * 0.12, 0, h * 0.45);
    tide.addColorStop(0, "rgba(128,74,40,0.22)");
    tide.addColorStop(0.5, "rgba(42,74,64,0.18)");
    tide.addColorStop(1, "rgba(35,44,50,0.08)");
    g.fillStyle = tide;
    g.fillRect(0, h * 0.12, w, h * 0.33);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Weathered barge steel deck plate texture with weld lines and subtle deck wear. */
export function bargeDeckTex(key = "ep3_barge_deck"): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    const r = rng(6203);
    g.fillStyle = "#626a73";
    g.fillRect(0, 0, w, h);

    // Plate seams
    g.strokeStyle = "rgba(34,39,45,0.42)";
    g.lineWidth = 2;
    for (let x = 0; x <= w; x += 128) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
    for (let y = 0; y <= h; y += 128) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    for (let i = 0; i < 500; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(130,86,56,0.08)" : "rgba(220,226,232,0.05)";
      g.fillRect(r() * w, r() * h, 4 + r() * 18, 4 + r() * 18);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** 4-lane highway bridge asphalt texture running along V (world Z) with dashed white lane dividers & double yellow median. */
export function highwayAsphaltTex(key = "ep3_highway_asphalt"): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    const r = rng(7304);
    g.fillStyle = "#484d56";
    g.fillRect(0, 0, w, h);

    // Asphalt grain
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(15,18,24,0.08)";
      g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 6);
    }

    // Subtle tire wear tracks in 4 lanes
    const laneXs = [w * 0.16, w * 0.36, w * 0.64, w * 0.84];
    for (const lx of laneXs) {
      g.fillStyle = "rgba(28,31,36,0.18)";
      g.fillRect(lx - 28, 0, 14, h);
      g.fillRect(lx + 14, 0, 14, h);
    }

    // Outer solid white shoulder lines
    g.fillStyle = "#e5e7eb";
    g.fillRect(w * 0.045, 0, 8, h);
    g.fillRect(w * 0.955 - 8, 0, 8, h);

    // Center double yellow median lines
    g.fillStyle = "#e6b43c";
    g.fillRect(w * 0.5 - 10, 0, 6, h);
    g.fillRect(w * 0.5 + 4, 0, 6, h);

    // Dashed white lane dividers
    g.fillStyle = "#e8ecf0";
    for (let y = 16; y < h; y += 96) {
      g.fillRect(w * 0.26 - 4, y, 8, 48);
      g.fillRect(w * 0.74 - 4, y, 8, 48);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Alternating black-and-white curb texture (signature ref_003 / ref_009 Indonesian bridge detail). */
export function zebraCurbTex(key = "ep3_zebra_curb"): THREE.CanvasTexture {
  const w = 64;
  const h = 256;
  const t = ctex(key, w, h, (g) => {
    for (let y = 0; y < h; y += 64) {
      g.fillStyle = (y / 64) % 2 === 0 ? "#ebe7dc" : "#1f242c";
      g.fillRect(0, y, w, 64);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Layered marine seabed & sedimentary/basalt bedrock cross-section texture. */
export function seabedStrataTex(key = "ep3_seabed_strata"): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    const r = rng(8405);
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0.0, "#a89878");
    gr.addColorStop(0.18, "#8c7d62");
    gr.addColorStop(0.42, "#61584c");
    gr.addColorStop(0.68, "#474649");
    gr.addColorStop(1.0, "#313339");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);

    for (let y = 40; y < h; y += 38) {
      g.strokeStyle = "rgba(25,22,20,0.22)";
      g.lineWidth = 3 + r() * 4;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) {
        g.lineTo(x, y + Math.sin(x * 0.03 + y) * 6);
      }
      g.stroke();
    }
    for (let i = 0; i < 420; i++) {
      const x = r() * w;
      const y = r() * h;
      g.fillStyle = r() > 0.5 ? "rgba(35,34,36,0.26)" : "rgba(195,180,152,0.18)";
      g.beginPath();
      g.ellipse(x, y, 3 + r() * 9, 2 + r() * 5, r() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Sandy ocean floor top surface texture (inside dry cofferdam & underwater seabed). */
export function seabedTopTex(key = "ep3_seabed_top"): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    const r = rng(8506);
    g.fillStyle = "#9c8d71";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(122,108,84,0.2)" : "rgba(205,190,162,0.16)";
      g.beginPath();
      g.ellipse(r() * w, r() * h, 6 + r() * 20, 2 + r() * 6, 0.15, 0, Math.PI * 2);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Distant city building facade for horizon skyline across the bay. */
export function skylineBuildingTex(key = "ep3_skyline_bldg"): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const t = ctex(key, w, h, (g) => {
    g.fillStyle = "#c8ced8";
    g.fillRect(0, 0, w, h);
    for (let y = 20; y < h - 20; y += 28) {
      for (let x = 16; x < w - 16; x += 36) {
        g.fillStyle = "#6c819c";
        g.fillRect(x, y, 22, 16);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
