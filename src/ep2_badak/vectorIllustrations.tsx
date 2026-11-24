import React from "react";

/**
 * 2.5D Illustrated Vector / Toon Component Kit
 * High-contrast, clean 2-tone SVG illustrations with crisp black outlines (#0F172A).
 * Strict adherence to RULES.md & user constraints.
 */

// ============================================================================
// 1. CALLOUT PILL & POINTER ARROWS
// ============================================================================

export const CalloutPill: React.FC<{
  text: string;
  subtext?: string;
  color?: string;
  bg?: string;
  arrow?: "up" | "down" | "left" | "right" | "none";
  scale?: number;
}> = ({
  text,
  subtext,
  color = "#EF4444",
  bg = "#FFFFFF",
  arrow = "none",
  scale = 1,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${scale})`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: bg,
          border: "3.5px solid #0F172A",
          borderRadius: "16px",
          padding: "8px 20px",
          boxShadow: "0 6px 0 #0F172A",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 900,
            fontSize: "24px",
            color,
            textTransform: "uppercase",
            letterSpacing: "1px",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
        {subtext ? (
          <span
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 800,
              fontSize: "16px",
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textAlign: "center",
            }}
          >
            {subtext}
          </span>
        ) : null}
      </div>

      {arrow === "down" ? (
        <svg width="24" height="14" viewBox="0 0 24 14" style={{ marginTop: "-2px" }}>
          <polygon points="12,14 0,0 24,0" fill="#0F172A" />
          <polygon points="12,10 3,2 21,2" fill={bg} />
        </svg>
      ) : null}
      {arrow === "up" ? (
        <svg width="24" height="14" viewBox="0 0 24 14" style={{ marginBottom: "-2px", order: -1 }}>
          <polygon points="12,0 0,14 24,14" fill="#0F172A" />
          <polygon points="12,4 3,12 21,12" fill={bg} />
        </svg>
      ) : null}
    </div>
  );
};

// ============================================================================
// 2. JAVAN RHINO (BADAK JAWA CULA SATU) VECTOR ILLUSTRATION
// ============================================================================

export const RhinoVector: React.FC<{
  frame: number;
  width?: number;
  height?: number;
  isBaby?: boolean;
  isMemorial?: boolean;
}> = ({ frame, width = 640, height = 400, isBaby = false, isMemorial = false }) => {
  const breath = Math.sin(frame * 0.08) * 3;
  const headNod = Math.sin(frame * 0.05) * 3;
  const earWiggle = Math.sin(frame * 0.12) * 5;

  const baseSkin = isMemorial ? "#94A3B8" : "#64748B";
  const shadeSkin = isMemorial ? "#64748B" : "#475569";
  const lightSkin = isMemorial ? "#CBD5E1" : "#94A3B8";
  const hornColor = isMemorial ? "#E2E8F0" : "#FBBF24";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <g transform={isBaby ? "scale(0.55) translate(240, 240)" : undefined}>
        {/* Soft Ground Shadow */}
        <ellipse
          cx="320"
          cy="365"
          rx="240"
          ry="24"
          fill="rgba(15, 23, 42, 0.22)"
        />

        {/* Back Legs (Darker shade) */}
        <g stroke="#0F172A" strokeWidth="4.5" strokeLinejoin="round" fill={shadeSkin}>
          {/* Back Right Leg */}
          <path d="M410 240 L420 345 L455 345 L445 240 Z" />
          {/* Front Right Leg */}
          <path d="M195 240 L190 345 L225 345 L230 240 Z" />
        </g>

        {/* Tail */}
        <path
          d="M480 205 Q510 225 500 270 Q490 280 485 270"
          stroke="#0F172A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main Body Armor Torso (Javan Rhino Iconic Armor Plates) */}
        <g transform={`translate(0, ${breath})`}>
          {/* Rump Armor Plate */}
          <path
            d="M340 170 Q460 170 480 220 Q485 270 450 280 L350 280 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Midsection Saddle Armor Plate */}
          <path
            d="M260 165 L360 170 L350 285 L250 285 Z"
            fill={lightSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Shoulder Armor Shield */}
          <path
            d="M170 170 Q240 160 270 180 L260 285 Q190 285 160 240 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Dermal Mosaic Texture Folds */}
          <path
            d="M265 175 Q255 220 260 275"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M355 175 Q345 225 350 275"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* Front Foreground Legs */}
        <g stroke="#0F172A" strokeWidth="5" strokeLinejoin="round" fill={baseSkin}>
          {/* Back Left Leg */}
          <path d="M370 235 L360 355 L395 355 L410 235 Z" />
          {/* Front Left Leg */}
          <path d="M150 235 L140 355 L175 355 L190 235 Z" />
        </g>
        {/* Toenails */}
        <g fill="#F1F5F9" stroke="#0F172A" strokeWidth="2.5">
          <ellipse cx="367" cy="352" rx="4" ry="3" />
          <ellipse cx="377" cy="352" rx="4" ry="3" />
          <ellipse cx="387" cy="352" rx="4" ry="3" />
          <ellipse cx="147" cy="352" rx="4" ry="3" />
          <ellipse cx="157" cy="352" rx="4" ry="3" />
          <ellipse cx="167" cy="352" rx="4" ry="3" />
        </g>

        {/* Head Group with Nodding Animation */}
        <g transform={`translate(0, ${headNod})`}>
          {/* Neck Base */}
          <path
            d="M190 150 Q130 150 110 200 Q140 270 190 250 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
          />

          {/* Head & Prehensile Snout */}
          <path
            d="M140 140 L70 200 Q50 220 60 240 L100 250 Q140 255 160 230 Z"
            fill={baseSkin}
            stroke="#0F172A"
            strokeWidth="5"
          />

          {/* Snout Chin Under-shade */}
          <path
            d="M60 240 L100 250 Q130 255 145 240 Q100 235 60 240 Z"
            fill={shadeSkin}
            stroke="#0F172A"
            strokeWidth="3.5"
          />

          {/* Single Nasal Horn (Cula Satu) — Iconic Feature */}
          <path
            d="M68 200 Q58 135 75 105 Q85 140 88 185 Z"
            fill={hornColor}
            stroke="#0F172A"
            strokeWidth="5"
          />
          {/* Horn Highlight */}
          <path
            d="M72 175 Q66 140 74 120"
            stroke="#FEF08A"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Eye */}
          <circle cx="115" cy="185" r="7.5" fill="#0F172A" />
          <circle cx="113" cy="183" r="2.8" fill="#FFFFFF" />

          {/* Nostril */}
          <ellipse cx="68" cy="225" rx="4" ry="5.5" fill="#0F172A" />

          {/* Ears with subtle wiggle */}
          <g transform={`rotate(${earWiggle}, 145, 135)`}>
            <path
              d="M135 140 Q130 92 148 88 Q156 108 145 140 Z"
              fill={baseSkin}
              stroke="#0F172A"
              strokeWidth="4"
            />
            <path
              d="M138 130 Q136 104 145 98"
              stroke="#F43F5E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Lush Green Grass Tufts on Ground */}
        <g fill="#16A34A" stroke="#0F172A" strokeWidth="2.5">
          <path d="M120 365 L110 345 L125 350 L130 340 L135 365 Z" />
          <path d="M250 368 L240 348 L255 352 L260 342 L265 368 Z" />
          <path d="M460 366 L450 346 L465 350 L470 340 L475 366 Z" />
        </g>
      </g>
    </svg>
  );
};

// ============================================================================
// 3. JAVA ISLAND INTERACTIVE VECTOR MAP
// ============================================================================

export const JavaMapVector: React.FC<{
  frame: number;
  highlightMode?: "full_route" | "short_route" | "banten_focus" | "purwo_focus";
  scale?: number;
}> = ({ frame, highlightMode = "full_route", scale = 1 }) => {
  // Animated dashed stroke offset
  const dashOffset = -frame * 4;

  return (
    <svg
      width={860 * scale}
      height={440 * scale}
      viewBox="0 0 900 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Background Ocean Waves Accents */}
      <g stroke="#38BDF8" strokeWidth="3" opacity="0.7">
        <path d="M40 70 Q70 60 100 70 T160 70" />
        <path d="M720 70 Q750 60 780 70 T840 70" />
        <path d="M100 390 Q130 380 160 390 T220 390" />
        <path d="M680 390 Q710 380 740 390 T800 390" />
      </g>

      {/* Java Island Full Vector Landmass */}
      <path
        d="M 80 230 
           Q 60 210 70 195 
           Q 90 190 110 205 
           Q 140 170 210 175 
           Q 290 185 370 175 
           Q 440 150 500 155 
           Q 540 180 590 175 
           Q 670 165 760 180 
           Q 820 195 830 220 
           Q 825 255 790 255 
           Q 740 260 650 250 
           Q 580 265 510 250 
           Q 450 265 370 255 
           Q 310 265 250 250 
           Q 200 270 150 255 
           Q 110 255 80 230 Z"
        fill="#22C55E"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Southern Interior Mountain Shade */}
      <path
        d="M 110 255 
           Q 150 255 200 270 
           Q 250 250 310 265 
           Q 370 255 450 265 
           Q 510 250 580 265 
           Q 650 250 740 260 
           Q 790 255 825 255 
           Q 800 240 750 245 
           Q 640 235 560 245 
           Q 460 235 380 245 
           Q 280 235 200 245 
           Q 140 240 110 255 Z"
        fill="#16A34A"
      />

      {/* Volcanic Peaks on Island (Krakatau, Pangrango, Slamet, Merapi, Semeru, Raung) */}
      <g fill="#15803D" stroke="#0F172A" strokeWidth="3.5">
        {/* West Java Mountains */}
        <polygon points="150,215 170,175 190,215" />
        <polygon points="210,215 230,185 250,215" />
        {/* Central Java (Slamet / Merapi) */}
        <polygon points="360,215 385,165 410,215" />
        <polygon points="430,220 455,175 480,220" />
        {/* East Java (Semeru / Bromo / Raung) */}
        <polygon points="620,215 650,160 680,215" />
        <polygon points="710,220 735,175 760,220" />
      </g>

      {/* Full Animated Translocation Route Arc (Banten -> Banyuwangi ~1.000 KM) */}
      {highlightMode === "full_route" || highlightMode === "purwo_focus" ? (
        <>
          {/* Glowing back-trace */}
          <path
            d="M 90 210 Q 450 70 810 220"
            stroke="#FEF08A"
            strokeWidth="16"
            opacity="0.6"
            fill="none"
          />
          {/* Animated Dashed Front Line */}
          <path
            d="M 90 210 Q 450 70 810 220"
            stroke="#F97316"
            strokeWidth="7"
            strokeDasharray="16 12"
            strokeDashoffset={dashOffset}
            fill="none"
          />
          {/* Apex Distance Badge */}
          <g transform="translate(450, 115)">
            <rect
              x="-115"
              y="-24"
              width="230"
              height="48"
              rx="14"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="4"
              filter="drop-shadow(0 4px 0 #0F172A)"
            />
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontWeight="900"
              fontSize="20"
              fill="#DC2626"
            >
              RUTE: ~1.000 KM
            </text>
          </g>
        </>
      ) : null}

      {/* Short Local Route (< 15 KM di dalam Ujung Kulon) */}
      {highlightMode === "short_route" ? (
        <g>
          <path
            d="M 90 210 Q 110 180 130 205"
            stroke="#EF4444"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* Local Distance Badge */}
          <g transform="translate(130, 155)">
            <rect
              x="-85"
              y="-20"
              width="170"
              height="40"
              rx="12"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="3.5"
            />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontWeight="900"
              fontSize="16"
              fill="#DC2626"
            >
              LOKAL &lt; 15 KM
            </text>
          </g>
        </g>
      ) : null}

      {/* PIN 1: TN UJUNG KULON (BANTEN) */}
      <g transform="translate(90, 210)">
        <circle cx="0" cy="0" r="16" fill="#0284C7" stroke="#0F172A" strokeWidth="4" />
        <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
        {/* Pin Pole */}
        <path d="M 0 -8 L 0 -50" stroke="#0F172A" strokeWidth="4" />
        <circle cx="0" cy="-50" r="14" fill="#EF4444" stroke="#0F172A" strokeWidth="3.5" />
        {/* Label Box */}
        <g transform="translate(-10, -78)">
          <rect
            x="-90"
            y="-14"
            width="180"
            height="32"
            rx="10"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3"
            filter="drop-shadow(0 3px 0 #0F172A)"
          />
          <text
            x="0"
            y="7"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="14"
            fill="#0284C7"
          >
            TN UJUNG KULON
          </text>
        </g>
      </g>

      {/* PIN 2: TN ALAS PURWO (BANYUWANGI) */}
      <g transform="translate(810, 220)">
        <circle cx="0" cy="0" r="16" fill="#F97316" stroke="#0F172A" strokeWidth="4" />
        <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
        {/* Pin Pole */}
        <path d="M 0 -8 L 0 -50" stroke="#0F172A" strokeWidth="4" />
        <circle cx="0" cy="-50" r="14" fill="#22C55E" stroke="#0F172A" strokeWidth="3.5" />
        {/* Label Box */}
        <g transform="translate(0, -78)">
          <rect
            x="-85"
            y="-14"
            width="170"
            height="32"
            rx="10"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3"
            filter="drop-shadow(0 3px 0 #0F172A)"
          />
          <text
            x="0"
            y="7"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="14"
            fill="#15803D"
          >
            TN ALAS PURWO
          </text>
        </g>
      </g>
    </svg>
  );
};

// ============================================================================
// 4. GUNUNG ANAK KRAKATAU & TSUNAMI VECTOR ILLUSTRATION
// ============================================================================

export const KrakatauVector: React.FC<{ frame: number; width?: number; height?: number }> = ({
  frame,
  width = 680,
  height = 380,
}) => {
  const smokePuff = Math.sin(frame * 0.1) * 8;
  const waveMove = (frame * 6) % 180;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 680 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Sky Eruption Glow */}
      <circle cx="340" cy="180" r="170" fill="rgba(239, 68, 68, 0.2)" />

      {/* Billowing Volcanic Smoke Plumes */}
      <g transform={`translate(0, ${smokePuff})`}>
        <circle cx="340" cy="90" r="54" fill="#475569" stroke="#0F172A" strokeWidth="4.5" />
        <circle cx="295" cy="65" r="46" fill="#334155" stroke="#0F172A" strokeWidth="4.5" />
        <circle cx="385" cy="60" r="48" fill="#334155" stroke="#0F172A" strokeWidth="4.5" />
        <circle cx="340" cy="35" r="42" fill="#1E293B" stroke="#0F172A" strokeWidth="4.5" />
        {/* Orange Fire Sparks in Plume */}
        <circle cx="330" cy="70" r="10" fill="#F97316" />
        <circle cx="360" cy="55" r="8" fill="#FBBF24" />
      </g>

      {/* Volcanic Cone (Anak Krakatau) */}
      <polygon
        points="190,280 310,135 370,135 490,280"
        fill="#334155"
        stroke="#0F172A"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Glowing Crater Lava Core */}
      <polygon
        points="310,135 340,155 370,135 340,130"
        fill="#EF4444"
        stroke="#0F172A"
        strokeWidth="3.5"
      />

      {/* Red Lava Rivers streaming down */}
      <path
        d="M340 155 Q325 210 300 275"
        stroke="#F97316"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M345 155 Q360 220 380 275"
        stroke="#EF4444"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Advancing Rolling Tsunami Wave across the Sea */}
      <g transform={`translate(${waveMove - 90}, 0)`}>
        <path
          d="M 60 310 Q 180 200 300 240 Q 260 280 200 310 Z"
          fill="#38BDF8"
          stroke="#0F172A"
          strokeWidth="5"
        />
        {/* Wave White Foam Crest */}
        <path
          d="M 280 235 Q 315 220 290 255"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>

      {/* Tsunami Warning Indicator Banner */}
      <g transform="translate(180, 310)">
        <rect
          x="-110"
          y="-20"
          width="220"
          height="40"
          rx="12"
          fill="#DC2626"
          stroke="#0F172A"
          strokeWidth="3.5"
        />
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="17"
          fill="#FFFFFF"
        >
          GELOMBANG TSUNAMI
        </text>
      </g>
    </svg>
  );
};

// ============================================================================
// 5. CARGO CRATE & TRANSPORT VIBRATION VECTOR
// ============================================================================

export const CargoCrateVector: React.FC<{
  frame: number;
  isVibrating?: boolean;
  width?: number;
  height?: number;
}> = ({ frame, isVibrating = false, width = 560, height = 340 }) => {
  const shakeX = isVibrating ? Math.sin(frame * 1.8) * 8 : 0;
  const shakeY = isVibrating ? Math.cos(frame * 2.4) * 6 : 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 560 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <g transform={`translate(${shakeX}, ${shakeY})`}>
        {/* Crate Ground Shadow */}
        <ellipse cx="280" cy="315" rx="210" ry="20" fill="rgba(15, 23, 42, 0.22)" />

        {/* Steel Container Outer Box */}
        <rect
          x="110"
          y="70"
          width="340"
          height="230"
          rx="14"
          fill="#475569"
          stroke="#0F172A"
          strokeWidth="6"
        />

        {/* Metal Ribs / Vertical Reinforcements */}
        <line x1="170" y1="70" x2="170" y2="300" stroke="#0F172A" strokeWidth="4" />
        <line x1="230" y1="70" x2="230" y2="300" stroke="#0F172A" strokeWidth="4" />
        <line x1="290" y1="70" x2="290" y2="300" stroke="#0F172A" strokeWidth="4" />
        <line x1="350" y1="70" x2="350" y2="300" stroke="#0F172A" strokeWidth="4" />
        <line x1="410" y1="70" x2="410" y2="300" stroke="#0F172A" strokeWidth="4" />

        {/* Yellow-Black Caution Hazard Stripe */}
        <g stroke="#0F172A" strokeWidth="3">
          <rect x="110" y="145" width="340" height="38" fill="#FBBF24" />
          <line x1="130" y1="145" x2="150" y2="183" strokeWidth="8" />
          <line x1="170" y1="145" x2="190" y2="183" strokeWidth="8" />
          <line x1="210" y1="145" x2="230" y2="183" strokeWidth="8" />
          <line x1="250" y1="145" x2="270" y2="183" strokeWidth="8" />
          <line x1="290" y1="145" x2="310" y2="183" strokeWidth="8" />
          <line x1="330" y1="145" x2="350" y2="183" strokeWidth="8" />
          <line x1="370" y1="145" x2="390" y2="183" strokeWidth="8" />
          <line x1="410" y1="145" x2="430" y2="183" strokeWidth="8" />
        </g>

        {/* Stencil Label Pill */}
        <rect
          x="150"
          y="210"
          width="260"
          height="45"
          rx="10"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3.5"
        />
        <text
          x="280"
          y="240"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="18"
          fill="#DC2626"
        >
          TRANSLOKASI SATWA LIAR
        </text>

        {/* Red Alarm Indicator Light on top */}
        <circle cx="280" cy="55" r="14" fill="#EF4444" stroke="#0F172A" strokeWidth="4" />
        <circle cx="276" cy="51" r="4" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

// ============================================================================
// 6. EKG HEART RATE & STRESS MONITOR VECTOR
// ============================================================================

export const EkgMonitorVector: React.FC<{
  frame: number;
  isFlatline?: boolean;
  width?: number;
  height?: number;
}> = ({ frame, isFlatline = false, width = 620, height = 320 }) => {
  const pulseOffset = (frame * 12) % 400;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 620 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Monitor Outer Shell */}
      <rect
        x="20"
        y="20"
        width="580"
        height="280"
        rx="22"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="6"
        filter="drop-shadow(0 10px 0 #0F172A)"
      />

      {/* Screen Frame */}
      <rect
        x="40"
        y="40"
        width="540"
        height="240"
        rx="14"
        fill="#0F172A"
      />

      {/* Grid Lines */}
      <g stroke="#1E293B" strokeWidth="1.5">
        <line x1="40" y1="100" x2="580" y2="100" />
        <line x1="40" y1="160" x2="580" y2="160" />
        <line x1="40" y1="220" x2="580" y2="220" />
        <line x1="150" y1="40" x2="150" y2="280" />
        <line x1="260" y1="40" x2="260" y2="280" />
        <line x1="370" y1="40" x2="370" y2="280" />
        <line x1="480" y1="40" x2="480" y2="280" />
      </g>

      {/* Monitor Header Readouts */}
      <text x="60" y="76" fontFamily="sans-serif" fontWeight="900" fontSize="22" fill="#38BDF8">
        HEART RATE:
      </text>
      <text
        x="220"
        y="76"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="24"
        fill={isFlatline ? "#EF4444" : "#22C55E"}
      >
        {isFlatline ? "0 BPM (FATAL)" : "185 BPM (STRES BERAT)"}
      </text>

      {/* EKG Waveform Path */}
      {isFlatline ? (
        <line x1="50" y1="160" x2="570" y2="160" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
      ) : (
        <g stroke="#EF4444" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path
            d={`M 50 160 
               L ${110 + pulseOffset * 0.1} 160 
               L ${140 + pulseOffset * 0.1} 140 
               L ${155 + pulseOffset * 0.1} 215 
               L ${170 + pulseOffset * 0.1} 85 
               L ${185 + pulseOffset * 0.1} 195 
               L ${200 + pulseOffset * 0.1} 160 
               L 570 160`}
          />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// 7. STATISTICAL BAR CHART VECTOR (GLOBAL STUDY DATA)
// ============================================================================

export const BarChartVector: React.FC<{
  frame: number;
  width?: number;
  height?: number;
}> = ({ frame, width = 600, height = 340 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Background Frame */}
      <rect
        x="20"
        y="20"
        width="560"
        height="300"
        rx="20"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="6"
        filter="drop-shadow(0 8px 0 #0F172A)"
      />

      {/* Chart Title */}
      <text
        x="300"
        y="60"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="22"
        fill="#0F172A"
      >
        TINGKAT KEBERHASILAN TRANSLOKASI LIAR
      </text>

      {/* Base Grid Line */}
      <line x1="80" y1="260" x2="520" y2="260" stroke="#0F172A" strokeWidth="4" />

      {/* Bar 1: GAGAL (> 65%) */}
      <g>
        <rect
          x="140"
          y="100"
          width="110"
          height="160"
          rx="10"
          fill="#EF4444"
          stroke="#0F172A"
          strokeWidth="4.5"
        />
        {/* Shading stripe */}
        <rect x="215" y="100" width="35" height="160" fill="#DC2626" rx="6" />
        {/* Percentage Text */}
        <text
          x="195"
          y="85"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="28"
          fill="#DC2626"
        >
          &gt; 65%
        </text>
        <text
          x="195"
          y="295"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="18"
          fill="#0F172A"
        >
          GAGAL
        </text>
      </g>

      {/* Bar 2: BERHASIL (~35%) */}
      <g>
        <rect
          x="340"
          y="180"
          width="110"
          height="80"
          rx="10"
          fill="#22C55E"
          stroke="#0F172A"
          strokeWidth="4.5"
        />
        {/* Shading stripe */}
        <rect x="415" y="180" width="35" height="80" fill="#16A34A" rx="6" />
        {/* Percentage Text */}
        <text
          x="395"
          y="165"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="28"
          fill="#16A34A"
        >
          ~35%
        </text>
        <text
          x="395"
          y="295"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="18"
          fill="#0F172A"
        >
          BERHASIL
        </text>
      </g>
    </svg>
  );
};

// ============================================================================
// 8. TANAMAN LANGKAP INVASION CROSS-SECTION VECTOR
// ============================================================================

export const LangkapForestVector: React.FC<{
  frame: number;
  width?: number;
  height?: number;
}> = ({ frame, width = 640, height = 380 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Sun Ray blocked at top */}
      <polygon points="320,0 200,100 440,100" fill="#FEF08A" opacity="0.4" />
      <circle cx="320" cy="15" r="40" fill="#FBBF24" stroke="#0F172A" strokeWidth="4" />

      {/* Blocked Sun Banner */}
      <g transform="translate(320, 45)">
        <rect
          x="-110"
          y="-14"
          width="220"
          height="30"
          rx="8"
          fill="#DC2626"
          stroke="#0F172A"
          strokeWidth="3"
        />
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="13"
          fill="#FFFFFF"
        >
          CAHAYA TERBLOKIR 95%
        </text>
      </g>

      {/* Tall Invasive Langkap Palm Trunks */}
      <g stroke="#0F172A" strokeWidth="4" fill="#78350F">
        <rect x="140" y="80" width="28" height="230" rx="4" />
        <rect x="305" y="65" width="32" height="245" rx="4" />
        <rect x="470" y="85" width="28" height="225" rx="4" />
      </g>

      {/* Dense Canopy Interlocking Palm Fronds (Blocking Light) */}
      <g fill="#15803D" stroke="#0F172A" strokeWidth="4.5">
        <path d="M150 90 Q60 120 20 170 Q80 145 150 125 Z" />
        <path d="M160 90 Q240 110 300 155 Q220 135 160 115 Z" />
        <path d="M320 70 Q200 90 120 125 Q220 110 310 95 Z" />
        <path d="M330 70 Q450 80 520 115 Q420 105 340 90 Z" />
        <path d="M480 95 Q400 125 350 160 Q420 135 480 120 Z" />
        <path d="M490 95 Q580 115 620 170 Q560 145 490 125 Z" />
      </g>

      {/* Forest Ground (Dark & Starved of Sunlight) */}
      <rect x="0" y="295" width="640" height="85" fill="#334155" />
      <line x1="0" y1="295" x2="640" y2="295" stroke="#0F172A" strokeWidth="5" />

      {/* Wilted Brown Shrubs (Pakan Badak Mati) with Red 'X' */}
      <g stroke="#0F172A" strokeWidth="3.5" fill="#78350F">
        {/* Shrub 1 */}
        <path d="M90 295 Q100 270 80 260 Q105 280 110 295 Z" />
        <line x1="85" y1="250" x2="105" y2="270" stroke="#EF4444" strokeWidth="4.5" />
        <line x1="105" y1="250" x2="85" y2="270" stroke="#EF4444" strokeWidth="4.5" />

        {/* Shrub 2 */}
        <path d="M260 295 Q270 265 250 255 Q280 280 285 295 Z" />
        <line x1="255" y1="245" x2="275" y2="265" stroke="#EF4444" strokeWidth="4.5" />
        <line x1="275" y1="245" x2="255" y2="265" stroke="#EF4444" strokeWidth="4.5" />

        {/* Shrub 3 */}
        <path d="M430 295 Q440 270 420 260 Q450 280 455 295 Z" />
        <line x1="425" y1="250" x2="445" y2="270" stroke="#EF4444" strokeWidth="4.5" />
        <line x1="445" y1="250" x2="425" y2="270" stroke="#EF4444" strokeWidth="4.5" />
      </g>

      {/* Label for Dead Forage */}
      <g transform="translate(320, 340)">
        <rect
          x="-95"
          y="-14"
          width="190"
          height="28"
          rx="8"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="14"
          fill="#DC2626"
        >
          PAKAN BADAK MATI
        </text>
      </g>
    </svg>
  );
};

// ============================================================================
// 9. CONSERVATION BALANCE SCALE VECTOR
// ============================================================================

export const BalanceScaleVector: React.FC<{
  frame: number;
  width?: number;
  height?: number;
}> = ({ frame, width = 580, height = 340 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 580 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Base Pedestal */}
      <polygon points="250,330 290,230 330,330" fill="#D97706" stroke="#0F172A" strokeWidth="4.5" />
      <rect x="210" y="320" width="160" height="20" rx="6" fill="#B45309" stroke="#0F172A" strokeWidth="4.5" />

      {/* Central Pillar */}
      <rect x="283" y="90" width="14" height="150" rx="4" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />
      <circle cx="290" cy="90" r="14" fill="#0F172A" />

      {/* Tilted Crossbeam: Left Drops Heavy, Right Rises */}
      <g transform="rotate(-12, 290, 90)">
        <rect x="80" y="84" width="420" height="12" rx="4" fill="#FBBF24" stroke="#0F172A" strokeWidth="4" />

        {/* Left Pan (Risk - Weighted Down) */}
        <g transform="translate(110, 90)">
          <line x1="0" y1="0" x2="-35" y2="75" stroke="#0F172A" strokeWidth="3" />
          <line x1="0" y1="0" x2="35" y2="75" stroke="#0F172A" strokeWidth="3" />
          <path d="M -50 75 Q 0 105 50 75 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="4" />
          {/* Heavy Weight Box on Pan */}
          <rect x="-35" y="40" width="70" height="35" rx="4" fill="#DC2626" stroke="#0F172A" strokeWidth="3.5" />
          <text x="0" y="63" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FFFFFF">
            RISIKO
          </text>
        </g>

        {/* Right Pan (Restoration - Elevated) */}
        <g transform="translate(470, 90)">
          <line x1="0" y1="0" x2="-35" y2="75" stroke="#0F172A" strokeWidth="3" />
          <line x1="0" y1="0" x2="35" y2="75" stroke="#0F172A" strokeWidth="3" />
          <path d="M -50 75 Q 0 105 50 75 Z" fill="#22C55E" stroke="#0F172A" strokeWidth="4" />
          {/* Shield Box on Pan */}
          <rect x="-35" y="40" width="70" height="35" rx="4" fill="#16A34A" stroke="#0F172A" strokeWidth="3.5" />
          <text x="0" y="63" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FFFFFF">
            PERKUAT
          </text>
        </g>
      </g>
    </svg>
  );
};

// ============================================================================
// 10. INTERACTIVE SPLIT-SCREEN OUTRO (OPTION A VS OPTION B)
// ============================================================================

export const OutroSplitScreenVector: React.FC<{
  activeOption: "A" | "B" | "BOTH";
  width?: number;
  height?: number;
}> = ({ activeOption, width = 940, height = 680 }) => {
  const isA = activeOption === "A";
  const isB = activeOption === "B";

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* 2 Split Cards Side by Side */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "530px",
          gap: "20px",
        }}
      >
        {/* PANEL A: PINDAH HABITAT */}
        <div
          style={{
            flex: 1,
            background: isA ? "#FFF7ED" : "#FFFFFF",
            border: isA ? "6.5px solid #EA580C" : "5px solid #0F172A",
            borderRadius: "28px",
            boxShadow: isA
              ? "0 12px 0 #EA580C, 0 16px 32px rgba(234, 88, 12, 0.25)"
              : "0 8px 0 #0F172A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "26px 16px",
            transform: isA ? "scale(1.03)" : "scale(0.98)",
            transition: "all 0.2s ease-out",
          }}
        >
          {/* Badge A */}
          <div
            style={{
              background: "#EA580C",
              border: "3.5px solid #0F172A",
              borderRadius: "18px",
              padding: "8px 24px",
              boxShadow: "0 5px 0 #0F172A",
            }}
          >
            <span
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: "28px",
                color: "#FFFFFF",
              }}
            >
              OPSI A
            </span>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: "34px",
                color: "#0F172A",
                margin: "0 0 8px 0",
                lineHeight: 1.15,
              }}
            >
              PINDAH
              <br />
              HABITAT
            </h2>
            <p
              style={{
                fontFamily: "sans-serif",
                fontWeight: 800,
                fontSize: "18px",
                color: "#EA580C",
                margin: 0,
              }}
            >
              ALAS PURWO (~1.000 KM)
            </p>
          </div>

          {/* Description Bullet Points */}
          <div
            style={{
              background: "#FED7AA",
              border: "3px solid #0F172A",
              borderRadius: "16px",
              padding: "12px 14px",
              width: "90%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontFamily: "sans-serif",
                fontWeight: 800,
                fontSize: "16px",
                color: "#7C2D12",
              }}
            >
              CADANGAN BENCANA
            </span>
            <span
              style={{
                fontFamily: "sans-serif",
                fontWeight: 800,
                fontSize: "16px",
                color: "#DC2626",
              }}
            >
              RISIKO PERJALANAN TINGGI
            </span>
          </div>
        </div>

        {/* PANEL B: PERKUAT UJUNG KULON */}
        <div
          style={{
            flex: 1,
            background: isB ? "#F0FDF4" : "#FFFFFF",
            border: isB ? "6.5px solid #16A34A" : "5px solid #0F172A",
            borderRadius: "28px",
            boxShadow: isB
              ? "0 12px 0 #16A34A, 0 16px 32px rgba(22, 163, 74, 0.25)"
              : "0 8px 0 #0F172A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "26px 16px",
            transform: isB ? "scale(1.03)" : "scale(0.98)",
            transition: "all 0.2s ease-out",
          }}
        >
          {/* Badge B */}
          <div
            style={{
              background: "#16A34A",
              border: "3.5px solid #0F172A",
              borderRadius: "18px",
              padding: "8px 24px",
              boxShadow: "0 5px 0 #0F172A",
            }}
          >
            <span
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: "28px",
                color: "#FFFFFF",
              }}
            >
              OPSI B
            </span>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "sans-serif",
                fontWeight: 900,
                fontSize: "34px",
                color: "#0F172A",
                margin: "0 0 8px 0",
                lineHeight: 1.15,
              }}
            >
              PERKUAT
              <br />
              UJUNG KULON
            </h2>
            <p
              style={{
                fontFamily: "sans-serif",
                fontWeight: 800,
                fontSize: "18px",
                color: "#16A34A",
                margin: 0,
              }}
            >
              HABITAT ASLI TERJAGA
            </p>
          </div>

          {/* Description Bullet Points */}
          <div
            style={{
              background: "#BBF7D0",
              border: "3px solid #0F172A",
              borderRadius: "16px",
              padding: "12px 14px",
              width: "90%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontFamily: "sans-serif",
                fontWeight: 800,
                fontSize: "16px",
                color: "#14532D",
              }}
            >
              BERSIHKAN LANGKAP
            </span>
            <span
              style={{
                fontFamily: "sans-serif",
                fontWeight: 800,
                fontSize: "16px",
                color: "#15803D",
              }}
            >
              ZERO TRANSLOCATION RISK
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div
        style={{
          width: "100%",
          background: "#0F172A",
          borderRadius: "20px",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 6px 0 rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontFamily: "sans-serif",
            fontWeight: 900,
            fontSize: "24px",
            color: "#FACC15",
            letterSpacing: "1px",
            textAlign: "center",
          }}
        >
          TULIS DI KOMENTAR: PILIH A ATAU B?
        </span>
      </div>
    </div>
  );
};
