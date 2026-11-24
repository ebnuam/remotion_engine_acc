/**
 * Episode 2 Badak Jawa — Theme Constants
 * 2.5D Technical Cross-Section / @ceritateknik style
 * Daytime palette — NO dark backgrounds, NO silhouettes
 */

export const THEME = {
  // Sky gradient (top → bottom)
  sky: {
    top: "#CBEAFF",
    mid: "#DFF6FF",
    bottom: "#F5F2E8",
    gradient: "linear-gradient(180deg, #CBEAFF 0%, #DFF6FF 46%, #F5F2E8 100%)",
  },

  // Ground / soil layers
  ground: {
    grass: "#16A34A",
    grassLight: "#4ADE80",
    topSoil: "#854D0E",
    subSoil: "#A16207",
    deepSoil: "#451A03",
  },

  // Rhino colors (Javan Rhino — dark slate armor)
  rhino: {
    base: "#64748B",
    shade: "#475569",
    light: "#94A3B8",
    horn: "#FBBF24",
    hornHighlight: "#FEF08A",
  },

  // Callout / annotation
  callout: {
    line: "#0F172A",
    lineWidth: 1.5,
    dot: 6,
    bg: "#FFFDF7",
    border: "#0F172A",
    text: "#0F172A",
  },

  // Scoreboard
  scoreboard: {
    bg: "#FFFDF7",
    border: "#0F172A",
    headerBg: "#0F172A",
    headerText: "#FFFFFF",
    pindahAccent: "#EF4444",
    perkuatAccent: "#16A34A",
    rowAlt: "#F8FAFC",
  },

  // Badge / UI chip
  badge: {
    bg: "#0F172A",
    text: "#FFFFFF",
    radius: 999,
  },

  // Map
  map: {
    island: "#22C55E",
    islandDark: "#16A34A",
    ocean: "#BAE6FD",
    routeOrange: "#F97316",
    routeGlow: "#FEF08A",
    pinBlue: "#0284C7",
    pinGreen: "#16A34A",
  },

  // Typography
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',

  // Safe zone (9:16 portrait 1080×1920)
  safeZone: {
    topPct: "14%",
    bottomPct: "26%",
    leftPct: "5%",
    rightPct: "5%",
    // pixel equivalents for 1080×1920
    topPx: 268,
    bottomPx: 499,
    leftPx: 54,
    rightPx: 54,
  },

  // Ink / outline
  ink: "#0F172A",
  inkLight: "#334155",
  inkMuted: "#64748B",

  // Accent colors for modes
  accent: {
    danger: "#DC2626",
    warning: "#D97706",
    success: "#16A34A",
    info: "#0284C7",
    neutral: "#0F172A",
  },
} as const;
