/**
 * Episode 2 Badak Jawa — Bright 2.5D Daytime Explainer Theme
 * Anti-stiff, sunlit, organic documentary palette.
 */
export const THEME = {
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  ink: "#0F172A",
  inkSoft: "#334155",
  sky: {
    top: "#BAE6FD",
    mid: "#DFF4FF",
    bottom: "#F8F4E8",
    gradient: "linear-gradient(180deg, #BAE6FD 0%, #DFF4FF 44%, #F8F4E8 100%)",
  },
  ground: {
    grassHighlight: "#4ADE80",
    grass: "#16A34A",
    grassDeep: "#15803D",
    topSoil: "#925418",
    subSoil: "#783F0E",
    deepSoil: "#4A2206",
    dryGrass: "#EAB308",
    dryTopSoil: "#CA8A04",
    dryDeepSoil: "#713F12",
  },
  rhino: {
    highlight: "#94A3B8",
    base: "#64748B",
    midShadow: "#475569",
    deepShadow: "#334155",
    hornBase: "#D97706",
    hornTip: "#FDE047",
  },
  ocean: {
    surface: "#38BDF8",
    mid: "#0284C7",
    deep: "#0369A1",
    foam: "#F0F9FF",
  },
  accent: {
    danger: "#DC2626",
    warning: "#EA580C",
    amber: "#D97706",
    success: "#16A34A",
    info: "#0284C7",
    cream: "#FFFDF7",
  },
} as const;
