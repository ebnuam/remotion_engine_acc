import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";

interface DistanceCompareSceneProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Scene 6: Distance Comparison (< 15 KM Local vs ~1.000 KM Across Java)
 * Native 1080x1920 stage, fitted strictly above subtitle safe zone (Y = 330..1150).
 */
export const DistanceCompareScene: React.FC<DistanceCompareSceneProps> = ({
  progress,
  shotId,
}) => {
  // Shot 24: Fokus lokal < 15 KM, Shot 25: Kontras jarak ekstrem ~1.000 KM
  const localBarW = interpolate(progress, [0, 0.5], [16, 42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const longBarProgress =
    shotId === 24
      ? interpolate(progress, [0.4, 1], [120, 420], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(progress, [0, 0.7], [420, 880], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const highlightLocal = shotId === 24;
  const highlightLong = shotId >= 25;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 50,
          right: 50,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          fontFamily: THEME.font,
        }}
      >
        {/* ================= CARD 1: LOKAL < 15 KM ================= */}
        <div
          style={{
            backgroundColor: "#FFFDF7",
            border: highlightLocal ? "6px solid #D97706" : "4px solid #0F172A",
            borderRadius: 26,
            padding: "26px 32px",
            boxShadow: "0 10px 0 rgba(15,23,42,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#64748B" }}>
                KASUS MUSOFA (DALAM KAWASAN)
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0F172A" }}>
                PINDAH LOKAL
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#FEF3C7",
                border: "3px solid #D97706",
                borderRadius: 16,
                padding: "10px 22px",
                fontSize: 40,
                fontWeight: 900,
                color: "#B45309",
              }}
            >
              &lt; 15 KM
            </div>
          </div>

          {/* Scale Bar Track (900px reference track) */}
          <div
            style={{
              width: "100%",
              height: 44,
              backgroundColor: "#F1F5F9",
              borderRadius: 14,
              border: "3px solid #CBD5E1",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: localBarW,
                height: "100%",
                backgroundColor: "#F59E0B",
                borderRadius: 9,
                border: "2.5px solid #0F172A",
              }}
            />
            <span style={{ marginLeft: 16, fontSize: 22, fontWeight: 900, color: "#B45309" }}>
              DEKAT — TETAP BERISIKO FATAL
            </span>
          </div>
        </div>

        {/* ================= VS / CONTRAST CONNECTOR ================= */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
          <div style={{ height: 4, flex: 1, backgroundColor: "#0F172A", opacity: 0.2, borderRadius: 4 }} />
          <div
            style={{
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              padding: "10px 28px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            BANDINGKAN JARAK USULAN
          </div>
          <div style={{ height: 4, flex: 1, backgroundColor: "#0F172A", opacity: 0.2, borderRadius: 4 }} />
        </div>

        {/* ================= CARD 2: LINTAS JAWA ~1.000 KM ================= */}
        <div
          style={{
            backgroundColor: "#FFFDF7",
            border: highlightLong ? "6px solid #DC2626" : "4px solid #0F172A",
            borderRadius: 26,
            padding: "26px 32px",
            boxShadow: "0 10px 0 rgba(15,23,42,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#64748B" }}>
                UJUNG KULON → ALAS PURWO
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0F172A" }}>
                LINTAS PULAU JAWA
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#FEE2E2",
                border: "3px solid #DC2626",
                borderRadius: 16,
                padding: "10px 22px",
                fontSize: 40,
                fontWeight: 900,
                color: "#DC2626",
              }}
            >
              ~1.000 KM
            </div>
          </div>

          {/* Full Scale Bar Track */}
          <div
            style={{
              width: "100%",
              height: 44,
              backgroundColor: "#F1F5F9",
              borderRadius: 14,
              border: "3px solid #CBD5E1",
              padding: 4,
              display: "flex",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: longBarProgress,
                height: "100%",
                background: "linear-gradient(90deg, #F97316 0%, #DC2626 100%)",
                borderRadius: 9,
                border: "2.5px solid #0F172A",
              }}
            />
          </div>

          <div style={{ fontSize: 23, fontWeight: 900, color: "#DC2626", textAlign: "right" }}>
            MENYEBERANG RATUSAN KILOMETER KE JATIM
          </div>
        </div>
      </div>
    </div>
  );
};
