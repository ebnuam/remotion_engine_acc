import React from "react";
import { THEME } from "../theme";

interface JavaIslandMapProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Geographically accurate vector map of Pulau Jawa & Madura
 * Features:
 * - Iconic Semenanjung Ujung Kulon (Banten) southwest tip
 * - Semenanjung Muria (Jepara) prominent northern bulge
 * - Pulau Madura off the northeast coast of Surabaya
 * - Semenanjung Blambangan (TN Alas Purwo) southeast hook
 * - Volcanic mountain peaks along the spine
 * - Animated translocation route line
 * - Dynamic route progress contrasting Banten start (Shot 8) vs Alas Purwo reached (Shot 10)
 * - Spacious, neatly padded distance badge (no text collision)
 */
export const JavaIslandMap: React.FC<JavaIslandMapProps> = ({
  frame,
  progress,
  shotId,
}) => {
  // Compute route progress based on shot
  // Shot 8 (TITIK AWAL: BANTEN): 0.05 to 0.20
  // Shot 9 (JALUR PULAU JAWA): 0.25 to 0.80
  // Shot 10-12 (ALAS PURWO, JATIM): 1.0 (completed)
  let routeCompletion = 1.0;
  if (shotId === 8) {
    routeCompletion = Math.min(0.25, 0.05 + progress * 0.20);
  } else if (shotId === 9) {
    routeCompletion = 0.25 + progress * 0.65;
  } else {
    routeCompletion = 1.0;
  }

  const isAtBanten = shotId === 8;
  const isAtAlasPurwo = shotId >= 10;

  // Radar ping pulse
  const pingScale = 1 + (Math.sin(frame * 0.2) * 0.5 + 0.5) * 0.8;
  const pingOpacity = 0.8 - (Math.sin(frame * 0.2) * 0.5 + 0.5) * 0.7;

  // Route arc endpoints
  // Banten (Ujung Kulon): x=95, y=275
  // Alas Purwo (Banyuwangi): x=940, y=295
  // Apex at x=517, y=105
  const arcLength = 1000;
  const dashOffset = -frame * 4;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", padding: "24px 30px" }}>
      {/* Ocean background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #BAE6FD 0%, #7DD3FC 100%)",
        }}
      />

      {/* Decorative ocean wave lines */}
      <svg
        viewBox="0 0 1080 800"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}
      >
        {[140, 260, 390, 520, 650].map((y, i) => (
          <path
            key={i}
            d={`M20 ${y} Q200 ${y - 14} 380 ${y} Q560 ${y + 14} 740 ${y} Q920 ${y - 14} 1060 ${y}`}
            stroke="#0284C7"
            strokeWidth="2.5"
            fill="none"
          />
        ))}
      </svg>

      {/* Main Map SVG */}
      <svg
        viewBox="0 0 1020 520"
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 2, overflow: "visible" }}
      >
        {/* ================= Pulau Jawa Main Landmass ================= */}
        {/* Accurate coastline with iconic Muria peninsula, Blambangan, & Ujung Kulon */}
        <path
          d={`M 90 270
             Q 65 290 45 280
             Q 30 260 52 245
             Q 75 235 90 205
             Q 105 185 130 180
             Q 155 190 185 182
             Q 235 182 295 190
             Q 330 180 370 170
             Q 410 155 450 160
             Q 480 175 520 185
             Q 550 190 600 185
             Q 640 180 690 185
             Q 720 160 745 130
             Q 775 130 790 165
             Q 815 190 860 195
             Q 895 205 930 215
             Q 965 220 995 230
             Q 1005 255 985 280
             Q 975 320 955 330
             Q 930 335 890 310
             Q 850 315 800 315
             Q 750 320 690 315
             Q 650 320 600 315
             Q 560 320 510 315
             Q 460 315 410 318
             Q 370 325 320 315
             Q 275 325 240 310
             Q 200 315 170 300
             Q 140 310 110 300
             Q 95 305 90 270 Z`}
          fill="#22C55E"
          stroke="#0F172A"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Mountain ridge south shading */}
        <path
          d={`M 90 270
             Q 110 300 140 310
             Q 170 300 200 315
             Q 240 310 275 325
             Q 320 315 370 325
             Q 410 318 460 315
             Q 510 315 560 320
             Q 600 315 650 320
             Q 690 315 750 320
             Q 800 315 850 315
             Q 890 310 930 335
             Q 955 330 975 320
             Q 950 300 900 295
             Q 840 290 770 295
             Q 700 290 630 295
             Q 550 290 480 295
             Q 400 295 330 290
             Q 260 295 200 285
             Q 140 280 90 270 Z`}
          fill="#16A34A"
          opacity="0.8"
        />

        {/* ================= Pulau Madura ================= */}
        <path
          d={`M 840 165
             Q 880 150 930 155
             Q 965 165 960 180
             Q 930 190 885 190
             Q 850 185 840 165 Z`}
          fill="#4ADE80"
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <text
          x="895"
          y="176"
          textAnchor="middle"
          fontFamily={THEME.font}
          fontWeight="800"
          fontSize="11"
          fill="#14532D"
        >
          P. MADURA
        </text>

        {/* ================= Volcanic Peaks ================= */}
        <g fill="#15803D" stroke="#0F172A" strokeWidth="2.5">
          {/* G. Halimun / Salak */}
          <polygon points="175,255 190,225 205,255" />
          {/* G. Gede / Pangrango */}
          <polygon points="230,250 245,220 260,250" />
          {/* G. Slamet */}
          <polygon points="450,255 470,210 490,255" />
          {/* G. Merapi / Merbabu */}
          <polygon points="560,250 580,215 600,250" />
          {/* G. Bromo / Semeru */}
          <polygon points="805,255 825,215 845,255" />
          {/* G. Ijen / Raung */}
          <polygon points="900,260 920,220 940,260" />
        </g>

        {/* ================= Translocation Route Arc ================= */}
        {/* Glow under-trace (only for active segment) */}
        <path
          d="M 95 260 Q 517 75 940 280"
          stroke="#FEF08A"
          strokeWidth="18"
          opacity="0.6"
          strokeDasharray={`${arcLength * routeCompletion} ${arcLength}`}
          fill="none"
          strokeLinecap="round"
        />

        {/* Full planned path: faint guide line in shot 9 and 10 */}
        {!isAtBanten && (
          <path
            d="M 95 260 Q 517 75 940 280"
            stroke="#CBD5E1"
            strokeWidth="4"
            strokeDasharray="8 8"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}

        {/* Active Animated Route Line */}
        <path
          d="M 95 260 Q 517 75 940 280"
          stroke="#EA580C"
          strokeWidth="7"
          strokeDashoffset={dashOffset}
          strokeDasharray={`${arcLength * routeCompletion} ${arcLength}`}
          fill="none"
          strokeLinecap="round"
        />

        {/* ================= Distance Banner (Apex) ================= */}
        {/* Sized with generous padding so text never overlaps or clips */}
        <g transform="translate(517, 85)">
          <rect
            x="-140"
            y="-32"
            width="280"
            height="64"
            rx="14"
            fill="#FFFDF7"
            stroke="#0F172A"
            strokeWidth="3.5"
            filter="drop-shadow(0 5px 0 #0F172A)"
          />
          {/* Badge accent tag */}
          <rect
            x="-140"
            y="-32"
            width="280"
            height="18"
            rx="12"
            fill="#EA580C"
          />
          <text
            x="0"
            y="-20"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="11"
            fill="#FFFFFF"
            letterSpacing="0.8"
          >
            TRANSLOKASI LINTAS JAWA
          </text>
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="20"
            fill="#DC2626"
            letterSpacing="0.5"
          >
            JARAK: ~1.000 KM
          </text>
          <text
            x="0"
            y="23"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="800"
            fontSize="12"
            fill="#475569"
            letterSpacing="0.4"
          >
            UJUNG KULON → ALAS PURWO
          </text>
        </g>

        {/* ================= PIN 1: TN UJUNG KULON (Banten) ================= */}
        <g transform="translate(95, 260)">
          {/* Radar ping when at Banten */}
          {isAtBanten && (
            <circle
              cx="0"
              cy="0"
              r={24 * pingScale}
              fill="none"
              stroke="#0284C7"
              strokeWidth="3"
              opacity={pingOpacity}
            />
          )}
          <circle cx="0" cy="0" r="16" fill="#0284C7" stroke="#0F172A" strokeWidth="4" />
          <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
          {/* Pin Pole */}
          <path d="M 0 -8 L 0 -50" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="0" cy="-50" r="12" fill="#EF4444" stroke="#0F172A" strokeWidth="3" />

          {/* Label Card */}
          <g transform="translate(0, -78)">
            <rect
              x="-82"
              y="-16"
              width="164"
              height="32"
              rx="9"
              fill="#FFFDF7"
              stroke="#0284C7"
              strokeWidth="2.5"
              filter="drop-shadow(0 3px 0 rgba(15,23,42,0.2))"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontFamily={THEME.font}
              fontWeight="900"
              fontSize="13"
              fill="#0284C7"
            >
              TN UJUNG KULON
            </text>
          </g>
        </g>

        {/* ================= PIN 2: TN ALAS PURWO (Banyuwangi) ================= */}
        <g transform="translate(940, 280)">
          {/* Radar ping when route completes to Alas Purwo */}
          {isAtAlasPurwo && (
            <circle
              cx="0"
              cy="0"
              r={24 * pingScale}
              fill="none"
              stroke="#16A34A"
              strokeWidth="3"
              opacity={pingOpacity}
            />
          )}
          <circle cx="0" cy="0" r="16" fill="#16A34A" stroke="#0F172A" strokeWidth="4" />
          <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
          {/* Pin Pole */}
          <path d="M 0 -8 L 0 -50" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="0" cy="-50" r="12" fill="#F97316" stroke="#0F172A" strokeWidth="3" />

          {/* Label Card */}
          <g transform="translate(0, -78)">
            <rect
              x="-80"
              y="-16"
              width="160"
              height="32"
              rx="9"
              fill="#FFFDF7"
              stroke="#16A34A"
              strokeWidth="2.5"
              filter="drop-shadow(0 3px 0 rgba(15,23,42,0.2))"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontFamily={THEME.font}
              fontWeight="900"
              fontSize="13"
              fill="#16A34A"
            >
              TN ALAS PURWO
            </text>
          </g>
        </g>

        {/* ================= Compass Rose ================= */}
        <g transform="translate(960, 60)">
          <circle cx="0" cy="0" r="26" fill="#FFFDF7" stroke="#0F172A" strokeWidth="2.5" opacity="0.95" />
          <text x="0" y="-11" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="13" fill="#DC2626">
            U
          </text>
          <text x="0" y="20" textAnchor="middle" fontFamily={THEME.font} fontWeight="700" fontSize="11" fill="#64748B">
            S
          </text>
          <text x="16" y="4" textAnchor="middle" fontFamily={THEME.font} fontWeight="700" fontSize="11" fill="#64748B">
            T
          </text>
          <text x="-16" y="4" textAnchor="middle" fontFamily={THEME.font} fontWeight="700" fontSize="11" fill="#64748B">
            B
          </text>
          <line x1="0" y1="-18" x2="0" y2="18" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="-18" y1="0" x2="18" y2="0" stroke="#0F172A" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};
