import React from "react";
import { THEME } from "../theme";
import { RhinoIllustration } from "./RhinoIllustration";

interface OutroSplitSceneProps {
  frame: number;
  shotId: number;
}

/**
 * Scene 10: Bright Daytime Split-Screen (OPSI A vs OPSI B) + CTA (1080x1920)
 * - Alternating highlight between Opsi A (Pindah) and Opsi B (Perkuat)
 * - Zero Unicode emoji
 * - CTA "TULIS DI KOMENTAR!" cleanly positioned above subtitle safe zone
 */
export const OutroSplitScene: React.FC<OutroSplitSceneProps> = ({
  frame,
  shotId,
}) => {
  // Alternate highlight based on narration cue timestamps:
  // [3414, 3498): "Lebih baik tetap dicoba dipindah demi cadangan," -> highlight A
  // [3498, 3582): "atau cukup perkuat habitat aslinya saja?" -> highlight B
  const highlightA = frame >= 3414 && frame < 3498;
  const highlightB = frame >= 3498;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      {/* Split-Screen Comparison Grid (Y = 335..985) */}
      <div
        style={{
          position: "absolute",
          top: 335,
          left: 44,
          right: 44,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          fontFamily: THEME.font,
          zIndex: 20,
        }}
      >
        {/* ================= OPSI A: PINDAH HABITAT ================= */}
        <div
          style={{
            backgroundColor: "#FEF3C7",
            border: highlightA ? "7px solid #EA580C" : "4.5px solid #0F172A",
            borderRadius: 28,
            padding: "28px 24px",
            boxShadow: highlightA ? "0 14px 0 #EA580C" : "0 10px 0 rgba(15,23,42,0.22)",
            transform: highlightA ? "scale(1.03)" : "scale(1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              backgroundColor: "#EA580C",
              color: "#FFFFFF",
              padding: "8px 24px",
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            OPSI A
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#0F172A",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            PINDAH HABITAT
          </div>

          {/* Mini Java Route Icon */}
          <svg viewBox="0 0 360 140" style={{ width: 320, height: 120 }}>
            <rect x="10" y="10" width="340" height="120" rx="18" fill="#FFFDF7" stroke="#0F172A" strokeWidth="3.5" />
            <path d="M 48 92 Q 115 76 185 82 Q 245 72 312 94 Q 260 106 180 104 Q 100 108 48 92 Z" fill="#22C55E" stroke="#0F172A" strokeWidth="3" />
            <path d="M 60 88 Q 180 28 302 90" stroke="#EA580C" strokeWidth="6" strokeDasharray="10 6" fill="none" />
            <circle cx="60" cy="88" r="8" fill="#0284C7" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="302" cy="90" r="8" fill="#DC2626" stroke="#0F172A" strokeWidth="2.5" />
          </svg>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ backgroundColor: "#FFFDF7", border: "2.5px solid #0F172A", borderRadius: 12, padding: "10px 14px", fontSize: 22, fontWeight: 900, color: "#0F172A", textAlign: "center" }}>
              CADANGAN POPULASI
            </div>
            <div style={{ backgroundColor: "#FEE2E2", border: "2.5px solid #DC2626", borderRadius: 12, padding: "10px 14px", fontSize: 22, fontWeight: 900, color: "#DC2626", textAlign: "center" }}>
              RISIKO STRES TINGGI
            </div>
          </div>
        </div>

        {/* ================= OPSI B: PERKUAT UJUNG KULON ================= */}
        <div
          style={{
            backgroundColor: "#DCFCE7",
            border: highlightB ? "7px solid #16A34A" : "4.5px solid #0F172A",
            borderRadius: 28,
            padding: "28px 24px",
            boxShadow: highlightB ? "0 14px 0 #15803D" : "0 10px 0 rgba(15,23,42,0.22)",
            transform: highlightB ? "scale(1.03)" : "scale(1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              backgroundColor: "#16A34A",
              color: "#FFFFFF",
              padding: "8px 24px",
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            OPSI B
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#14532D",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            PERKUAT HABITAT
          </div>

          {/* Mini Healthy Rhino Icon */}
          <div
            style={{
              width: 320,
              height: 120,
              backgroundColor: "#FFFDF7",
              borderRadius: 18,
              border: "3.5px solid #0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <RhinoIllustration frame={frame} scale={0.34} walkSpeed={0.6} />
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ backgroundColor: "#FFFDF7", border: "2.5px solid #0F172A", borderRadius: 12, padding: "10px 14px", fontSize: 22, fontWeight: 900, color: "#14532D", textAlign: "center" }}>
              JAGA UJUNG KULON
            </div>
            <div style={{ backgroundColor: "#BBF7D0", border: "2.5px solid #16A34A", borderRadius: 12, padding: "10px 14px", fontSize: 22, fontWeight: 900, color: "#14532D", textAlign: "center" }}>
              HINDARI RISIKO PINDAH
            </div>
          </div>
        </div>
      </div>

      {/* Center VS Circle */}
      <div
        style={{
          position: "absolute",
          top: 590,
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 84,
          height: 84,
          borderRadius: 999,
          backgroundColor: "#0F172A",
          border: "5px solid #FFFFFF",
          color: "#FFFFFF",
          fontFamily: THEME.font,
          fontSize: 32,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
          boxShadow: "0 8px 0 rgba(15,23,42,0.28)",
        }}
      >
        VS
      </div>

      {/* CTA Banner cleanly positioned ABOVE subtitle safe zone (Y = 1040..1150) */}
      <div
        style={{
          position: "absolute",
          top: 1035,
          left: "50%",
          transform: `translateX(-50%) scale(${shotId === 40 ? 1.04 : 1})`,
          backgroundColor: "#FDE047",
          border: "5px solid #0F172A",
          borderRadius: 24,
          padding: "18px 48px",
          boxShadow: "0 10px 0 #0F172A",
          zIndex: 25,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: THEME.font,
            fontWeight: 900,
            fontSize: 38,
            color: "#0F172A",
            letterSpacing: 1,
          }}
        >
          TULIS DI KOMENTAR!
        </span>
      </div>
    </div>
  );
};
