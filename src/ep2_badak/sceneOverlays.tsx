import React from "react";
import { interpolate, spring } from "remotion";

/**
 * Scene Overlays for Kok Iso Yo? Ep 2: Badak Ujung Kulon
 * High-contrast, clean 9:16 overlays.
 * Bounded safely between top: 18% (under Badge UI at 13.5%) and bottom: 22% (above Subtitle at 19%).
 */

// ============================================================================
// 1. SCENE 1 OVERLAYS (f0–f492)
// ============================================================================

export const PopulationCounterOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = spring({ frame: Math.max(0, frame - 15), fps: 30, config: { damping: 12, stiffness: 150 } });
  const pulse = Math.sin(frame * 0.1) * 3;

  return (
    <div
      style={{
        position: "absolute",
        top: "27%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${enter}) translateY(${pulse}px)`,
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.88)",
          border: "4.5px solid #F59E0B",
          borderRadius: "28px",
          padding: "24px 44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 158, 11, 0.3)",
        }}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "20px",
            color: "#CBD5E1",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}
        >
          POPULASI TERANCAM PUNAH
        </span>
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "68px",
            color: "#FBBF24",
            letterSpacing: "2px",
            textShadow: "0 4px 16px rgba(251, 191, 36, 0.5)",
            lineHeight: 1,
          }}
        >
          &lt; 80 EKOR
        </span>
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 800,
            fontSize: "17px",
            color: "#E2E8F0",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          CUMA TERSISA DI TN UJUNG KULON
        </span>
      </div>
    </div>
  );
};

export const StampRejectedOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 306;
  const slam = spring({ frame: localFrame, fps: 30, config: { damping: 9, stiffness: 220, mass: 0.8 } });
  const scale = interpolate(slam, [0, 1], [2.8, 1.0]);

  return (
    <div
      style={{
        position: "absolute",
        top: "35%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${scale}) rotate(-8deg)`,
        pointerEvents: "none",
        zIndex: 42,
      }}
    >
      <div
        style={{
          background: "rgba(220, 38, 38, 0.95)",
          border: "8px solid #FFFFFF",
          borderRadius: "28px",
          padding: "24px 54px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(220, 38, 38, 0.6)",
        }}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "72px",
            color: "#FFFFFF",
            letterSpacing: "3px",
            textShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            lineHeight: 1.1,
          }}
        >
          DITOLAK KERAS!
        </span>
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 800,
            fontSize: "20px",
            color: "#FEF2F2",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}
        >
          KONSENSUS ILMUWAN & AKTIVIS
        </span>
      </div>
    </div>
  );
};

export const HookTitleOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 432;
  const pop = spring({ frame: localFrame, fps: 30, config: { damping: 11, stiffness: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        top: "33%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${pop})`,
        pointerEvents: "none",
        zIndex: 42,
      }}
    >
      <div
        style={{
          background: "#FACC15",
          border: "8px solid #0F172A",
          borderRadius: "36px",
          padding: "36px 64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 18px 0 #0F172A, 0 24px 50px rgba(0, 0, 0, 0.7)",
        }}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "36px",
            color: "#0F172A",
            letterSpacing: "2px",
          }}
        >
          LHO...
        </span>
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "76px",
            color: "#0F172A",
            letterSpacing: "3px",
            lineHeight: 1.1,
          }}
        >
          KOK ISO YO?!
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 2. SCENE 2 OVERLAYS (PETA PULAU JAWA f492–f942 & f1842–f2076)
// ============================================================================

export const JavaMapSplineOverlay: React.FC<{
  frame: number;
  mode?: "full_route" | "compare_distance";
}> = ({ frame, mode = "full_route" }) => {
  const dashOffset = -frame * 6;
  const pulse = Math.sin(frame * 0.15) * 4;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 35,
      }}
    >
      {/* Route SVG Overlay */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Full Route Glowing Arc Banten -> Banyuwangi */}
        <path
          d="M 190 980 Q 540 760 890 1020"
          stroke="#FEF08A"
          strokeWidth="18"
          opacity="0.6"
          fill="none"
        />
        <path
          d="M 190 980 Q 540 760 890 1020"
          stroke="#EA580C"
          strokeWidth="8"
          strokeDasharray="20 14"
          strokeDashoffset={dashOffset}
          fill="none"
        />

        {/* Local Route comparison circle if mode is compare_distance */}
        {mode === "compare_distance" ? (
          <path
            d="M 190 980 Q 210 930 230 970"
            stroke="#FACC15"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </svg>

      {/* Pin 1: TN Ujung Kulon (Banten) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "14%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${pulse}px)`,
        }}
      >
        <div
          style={{
            background: "#0284C7",
            color: "#FFFFFF",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "17px",
            padding: "8px 18px",
            borderRadius: "16px",
            border: "3.5px solid #0F172A",
            boxShadow: "0 6px 0 #0F172A",
            marginBottom: "6px",
            whiteSpace: "nowrap",
          }}
        >
          TN UJUNG KULON (BANTEN)
        </div>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#EF4444",
            border: "4px solid #FFFFFF",
            boxShadow: "0 0 16px #EF4444",
          }}
        />
      </div>

      {/* Distance Badge at Center Peak */}
      <div
        style={{
          position: "absolute",
          top: "39%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "4.5px solid #0F172A",
            borderRadius: "22px",
            padding: "12px 28px",
            boxShadow: "0 8px 0 #0F172A, 0 14px 28px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "26px",
              color: "#DC2626",
              letterSpacing: "1px",
            }}
          >
            {mode === "compare_distance" ? "15 KM LOKAL vs ~1.000 KM JATIM" : "RUTE TRANSLOKASI: ~1.000 KM"}
          </span>
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 800,
              fontSize: "15px",
              color: "#475569",
              letterSpacing: "0.5px",
            }}
          >
            {mode === "compare_distance" ? "RISIKO EKSTREM DI PERJALANAN" : "MENYEBERANG DARI UJUNG BARAT KE UJUNG TIMUR"}
          </span>
        </div>
      </div>

      {/* Pin 2: TN Alas Purwo (Banyuwangi) */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          right: "12%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${-pulse}px)`,
        }}
      >
        <div
          style={{
            background: "#16A34A",
            color: "#FFFFFF",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "17px",
            padding: "8px 18px",
            borderRadius: "16px",
            border: "3.5px solid #0F172A",
            boxShadow: "0 6px 0 #0F172A",
            marginBottom: "6px",
            whiteSpace: "nowrap",
          }}
        >
          TN ALAS PURWO (BANYUWANGI)
        </div>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#22C55E",
            border: "4px solid #FFFFFF",
            boxShadow: "0 0 16px #22C55E",
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// 3. SCENE 3 OVERLAY: KRAKATAU & TSUNAMI (f942–f1200)
// ============================================================================

export const KrakatauWarningOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 942;
  const pulse = Math.sin(localFrame * 0.2) * 0.15;
  const vignetteAlpha = 0.35 + pulse;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 35,
        boxShadow: `inset 0 0 120px rgba(220, 38, 38, ${vignetteAlpha})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(220, 38, 38, 0.92)",
            border: "4.5px solid #FFFFFF",
            borderRadius: "22px",
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(220, 38, 38, 0.6)",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#FBBF24",
              boxShadow: "0 0 12px #FBBF24",
            }}
          />
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "26px",
              color: "#FFFFFF",
              letterSpacing: "1.5px",
            }}
          >
            ANCAMAN: ERUPSI & TSUNAMI
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. SCENE 4 OVERLAY: EKG MONITOR PULSE (f1200–f1608)
// ============================================================================

export const EkgTelemetryOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const pulseOffset = (frame * 16) % 400;

  return (
    <div
      style={{
        position: "absolute",
        top: "26%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.92)",
          border: "4.5px solid #EF4444",
          borderRadius: "26px",
          padding: "20px 32px",
          width: "84%",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "20px",
              color: "#38BDF8",
              letterSpacing: "1px",
            }}
          >
            TELEMETRI DETAK JANTUNG BADAK
          </span>
          <div
            style={{
              background: "#DC2626",
              color: "#FFFFFF",
              padding: "4px 14px",
              borderRadius: "10px",
              fontWeight: 900,
              fontSize: "14px",
            }}
          >
            STRES BERAT
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "52px",
              color: "#EF4444",
              lineHeight: 1,
            }}
          >
            185 BPM
          </span>
          <span style={{ fontSize: "18px", color: "#FCA5A5", fontWeight: 800 }}>
            (LONJAKAN KORTISOL BERBAHAYA)
          </span>
        </div>

        {/* EKG Waveform */}
        <svg width="100%" height="60" viewBox="0 0 600 60" fill="none">
          <line x1="0" y1="30" x2="600" y2="30" stroke="#1E293B" strokeWidth="1.5" />
          <path
            d={`M 0 30 
               L ${100 + pulseOffset * 0.15} 30 
               L ${120 + pulseOffset * 0.15} 15 
               L ${135 + pulseOffset * 0.15} 52 
               L ${150 + pulseOffset * 0.15} 6 
               L ${165 + pulseOffset * 0.15} 45 
               L ${180 + pulseOffset * 0.15} 30 
               L 600 30`}
            stroke="#EF4444"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

// ============================================================================
// 5. SCENE 5 OVERLAY: MUSOFA MEMORIAL FLATLINE (f1608–f1842)
// ============================================================================

export const MusofaMemorialOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "26%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      {/* Flatline Telemetry */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.94)",
          border: "4.5px solid #94A3B8",
          borderRadius: "26px",
          padding: "20px 32px",
          width: "84%",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "20px",
              color: "#94A3B8",
              letterSpacing: "1px",
            }}
          >
            STATUS VITAL: KASUS MUSOFA
          </span>
          <div
            style={{
              background: "#475569",
              color: "#FFFFFF",
              padding: "4px 14px",
              borderRadius: "10px",
              fontWeight: 900,
              fontSize: "14px",
            }}
          >
            FATAL
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "52px",
              color: "#DC2626",
              lineHeight: 1,
            }}
          >
            0 BPM
          </span>
          <span style={{ fontSize: "20px", color: "#EF4444", fontWeight: 900 }}>
            (GARIS LURUS / FLATLINE)
          </span>
        </div>

        {/* Straight Flatline */}
        <svg width="100%" height="40" viewBox="0 0 600 40" fill="none">
          <line x1="0" y1="20" x2="600" y2="20" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Historical Label Pill */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.85)",
          border: "3.5px solid #FFFFFF",
          borderRadius: "18px",
          padding: "12px 28px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "20px",
            color: "#FFFFFF",
          }}
        >
          SEEKOR BADAK JANTAN MATI PASCA-TRANSLOKASI
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 6. SCENE 6 OVERLAY: ADAPTATION FAILURE STATS (f2076–f2520)
// ============================================================================

export const ForeignHabitatStatsOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "26%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.92)",
          border: "4.5px solid #EF4444",
          borderRadius: "28px",
          padding: "24px 32px",
          width: "86%",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "20px",
            color: "#94A3B8",
            textAlign: "center",
            letterSpacing: "1px",
          }}
        >
          STUDI BIOLOGI KONSERVASI GLOBAL
        </span>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {/* GAGAL BAR */}
          <div style={{ flex: 1.8, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 900, fontSize: "36px", color: "#EF4444" }}>&gt; 65%</span>
              <span style={{ fontWeight: 900, fontSize: "18px", color: "#EF4444" }}>GAGAL</span>
            </div>
            <div style={{ height: "18px", background: "#334155", borderRadius: "9px", overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: "#EF4444" }} />
            </div>
            <span style={{ fontSize: "14px", color: "#CBD5E1", fontWeight: 700 }}>
              Susah adaptasi & gagal berkembang biak
            </span>
          </div>

          {/* BERHASIL BAR */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 900, fontSize: "28px", color: "#22C55E" }}>~35%</span>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "#22C55E" }}>BERHASIL</span>
            </div>
            <div style={{ height: "18px", background: "#334155", borderRadius: "9px", overflow: "hidden" }}>
              <div style={{ width: "35%", height: "100%", background: "#22C55E" }} />
            </div>
            <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 700 }}>
              Sangat langka
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. SCENE 7 OVERLAY: LANGKAP INVASION (f2520–f2928)
// ============================================================================

export const LangkapInvasionOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      {/* Top Banner on Canopy */}
      <div
        style={{
          position: "absolute",
          top: "26%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(220, 38, 38, 0.92)",
            border: "4px solid #FFFFFF",
            borderRadius: "20px",
            padding: "12px 28px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
          }}
        >
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "22px",
              color: "#FFFFFF",
              letterSpacing: "1px",
            }}
          >
            CAHAYA MATAHARI TERBLOKIR 95%
          </span>
        </div>
      </div>

      {/* Downward indicator */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            border: "3.5px solid #F59E0B",
            borderRadius: "18px",
            padding: "10px 24px",
          }}
        >
          <span style={{ fontWeight: 900, fontSize: "20px", color: "#FBBF24" }}>
            INVASI ARENGA OBTUSIFOLIA
          </span>
        </div>
      </div>

      {/* Center Floor Banner */}
      <div
        style={{
          position: "absolute",
          top: "53%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.92)",
            border: "4px solid #EF4444",
            borderRadius: "20px",
            padding: "12px 28px",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.8)",
          }}
        >
          <span style={{ fontWeight: 900, fontSize: "22px", color: "#EF4444" }}>
            TUMBUHAN PAKAN BADAK MATI
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 8. SCENE 8 OVERLAY: RESTORATION & HOPE (f2928–f3372)
// ============================================================================

export const HabitatRestorationOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      {/* Warm Ambient Sun Glow */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0) 70%)",
        }}
      />

      {/* Center Solution Pill */}
      <div
        style={{
          position: "absolute",
          top: "27%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(22, 163, 74, 0.92)",
            border: "4.5px solid #FFFFFF",
            borderRadius: "24px",
            padding: "16px 36px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 14px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(34, 197, 94, 0.4)",
          }}
        >
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              fontSize: "26px",
              color: "#FFFFFF",
              letterSpacing: "1.5px",
            }}
          >
            FOKUS: PERKUAT UJUNG KULON
          </span>
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 800,
              fontSize: "16px",
              color: "#DCFCE7",
              letterSpacing: "1px",
            }}
          >
            PEMBERSIHAN LANGKAP & PATROLI KETAT
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 9. OUTRO SPLIT-SCREEN OVERLAY (f3372–f3624)
// ============================================================================

export const OutroSplitScreenOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const isHighlightA = frame >= 3414 && frame < 3498;
  const isHighlightB = frame >= 3498 && frame < 3582;
  const isCta = frame >= 3582;

  const ctaSpring = spring({ frame: Math.max(0, frame - 3582), fps: 30, config: { damping: 10, stiffness: 200 } });
  const pulse = Math.sin((frame - 3582) * 0.25) * 0.05;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 45,
      }}
    >
      {/* Left / Right Card Labels */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 28px",
          gap: "20px",
        }}
      >
        {/* Card A Label */}
        <div
          style={{
            flex: 1,
            background: isHighlightA ? "rgba(234, 88, 12, 0.95)" : "rgba(15, 23, 42, 0.88)",
            border: isHighlightA ? "6px solid #FFFFFF" : "4px solid #EA580C",
            borderRadius: "24px",
            padding: "20px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            transform: isHighlightA ? "scale(1.04)" : "scale(0.97)",
            transition: "all 0.2s ease-out",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.7)",
          }}
        >
          <div
            style={{
              background: "#EA580C",
              color: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: "12px",
              fontWeight: 900,
              fontSize: "20px",
              alignSelf: "center",
            }}
          >
            OPSI A
          </div>
          <span style={{ fontWeight: 900, fontSize: "28px", color: "#FFFFFF", lineHeight: 1.15 }}>
            PINDAH HABITAT
          </span>
          <span style={{ fontWeight: 800, fontSize: "15px", color: "#FED7AA" }}>
            ALAS PURWO (~1.000 KM)
          </span>
          <div style={{ height: "2px", background: "rgba(255,255,255,0.2)", margin: "4px 0" }} />
          <span style={{ fontWeight: 800, fontSize: "14px", color: "#CBD5E1" }}>
            CADANGAN BENCANA
          </span>
          <span style={{ fontWeight: 900, fontSize: "14px", color: "#EF4444" }}>
            RISIKO TRANSLOKASI TINGGI
          </span>
        </div>

        {/* Card B Label */}
        <div
          style={{
            flex: 1,
            background: isHighlightB ? "rgba(22, 163, 74, 0.95)" : "rgba(15, 23, 42, 0.88)",
            border: isHighlightB ? "6px solid #FFFFFF" : "4px solid #16A34A",
            borderRadius: "24px",
            padding: "20px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            transform: isHighlightB ? "scale(1.04)" : "scale(0.97)",
            transition: "all 0.2s ease-out",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.7)",
          }}
        >
          <div
            style={{
              background: "#16A34A",
              color: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: "12px",
              fontWeight: 900,
              fontSize: "20px",
              alignSelf: "center",
            }}
          >
            OPSI B
          </div>
          <span style={{ fontWeight: 900, fontSize: "28px", color: "#FFFFFF", lineHeight: 1.15 }}>
            PERKUAT UJUNG KULON
          </span>
          <span style={{ fontWeight: 800, fontSize: "15px", color: "#BBF7D0" }}>
            HABITAT ASLI TERJAGA
          </span>
          <div style={{ height: "2px", background: "rgba(255,255,255,0.2)", margin: "4px 0" }} />
          <span style={{ fontWeight: 800, fontSize: "14px", color: "#CBD5E1" }}>
            BERSIHKAN LANGKAP
          </span>
          <span style={{ fontWeight: 900, fontSize: "14px", color: "#22C55E" }}>
            ZERO TRANSLOCATION RISK
          </span>
        </div>
      </div>

      {/* CTA Banner Slam In */}
      {isCta && (
        <div
          style={{
            position: "absolute",
            top: "56%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${ctaSpring + pulse})`,
          }}
        >
          <div
            style={{
              background: "#FACC15",
              border: "6px solid #0F172A",
              borderRadius: "28px",
              padding: "18px 48px",
              boxShadow: "0 12px 0 #0F172A, 0 20px 40px rgba(0, 0, 0, 0.6)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 900,
                fontSize: "36px",
                color: "#0F172A",
                letterSpacing: "1.5px",
              }}
            >
              TULIS DI KOMENTAR: PILIH A ATAU B?
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
