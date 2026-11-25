import React from "react";
import { THEME } from "../theme";

interface JavaIslandMapProps {
  frame: number;
  progress: number;
  shotId: number;
}

/**
 * Geographically accurate vector map of Pulau Jawa & Madura (1080x1920 native stage)
 * Features:
 * - Recognizable coastline: Ujung Kulon, Semenanjung Muria, Pulau Madura, Semenanjung Blambangan
 * - Large, mobile-readable labels with safe screen margins
 * - Distinct visual progression: Banten radar + route start (Shot 8) vs Alas Purwo arrival (Shot 10)
 */
export const JavaIslandMap: React.FC<JavaIslandMapProps> = ({
  frame,
  progress,
  shotId,
}) => {
  // Shot 8 (f492-600): Start in Banten (~14% - 22%)
  // Shot 9 (f600-708): Traveling mid-Java (~30% - 82%)
  // Shot 10-12 (f708-942): Arrived at Alas Purwo (100%)
  let routeCompletion = 1.0;
  if (shotId === 8) {
    routeCompletion = 0.14 + progress * 0.12;
  } else if (shotId === 9) {
    routeCompletion = 0.28 + progress * 0.56;
  } else {
    routeCompletion = 1.0;
  }

  const isAtBanten = shotId === 8;
  const isAtAlasPurwo = shotId >= 10;

  const pingPhase = (Math.sin(frame * 0.22) + 1) * 0.5;
  const pingScale = 1 + pingPhase * 0.9;
  const pingOpacity = 0.9 - pingPhase * 0.75;

  // Clip X coordinate for active animated dashed line
  const startX = 115;
  const endX = 955;
  const clipWidth = startX + (endX - startX) * routeCompletion + 20;
  const dashOffset = -frame * 5;

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      {/* Bright Ocean Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #CBEAFF 0%, #93E3FF 40%, #7DD3FC 100%)",
        }}
      />

      {/* Decorative Ocean Waves */}
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: 0.32 }}
      >
        {[420, 620, 1020, 1200, 1620].map((y, i) => (
          <path
            key={i}
            d={`M 0 ${y} Q 180 ${y - 22} 360 ${y} Q 540 ${y + 22} 720 ${y} Q 900 ${y - 22} 1080 ${y}`}
            stroke="#0284C7"
            strokeWidth="4"
            fill="none"
          />
        ))}
      </svg>

      {/* Main Map Stage positioned cleanly between top badge (300px) and subtitle zone (1210px) */}
      <svg
        viewBox="0 0 1080 860"
        style={{
          position: "absolute",
          top: 320,
          left: 0,
          width: 1080,
          height: 860,
          overflow: "visible",
        }}
      >
        <defs>
          <clipPath id="routeTravelClip">
            <rect x="0" y="0" width={clipWidth} height="860" />
          </clipPath>
        </defs>

        {/* ================= PULAU JAWA MAIN LANDMASS ================= */}
        {/* Recognizable elongated west-to-east shape with Ujung Kulon, Muria, & Blambangan */}
        <path
          d={`M 105 565
             Q 75 595 55 578
             Q 42 552 68 532
             Q 96 518 112 478
             Q 132 452 162 448
             Q 192 462 225 452
             Q 280 452 340 462
             Q 376 446 418 432
             Q 456 416 498 424
             Q 530 442 570 452
             Q 605 458 645 452
             Q 682 446 726 452
             Q 755 418 782 382
             Q 814 382 828 424
             Q 852 454 894 462
             Q 930 472 964 484
             Q 995 492 1015 508
             Q 1022 542 1002 572
             Q 992 612 970 624
             Q 944 630 908 602
             Q 870 606 822 606
             Q 772 614 716 606
             Q 672 614 622 606
             Q 578 614 528 606
             Q 480 606 432 610
             Q 388 618 340 606
             Q 298 618 260 600
             Q 218 606 188 588
             Q 158 598 128 588
             Q 112 582 105 565 Z`}
          fill="#22C55E"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Interior Mountain Ridge Shading */}
        <path
          d={`M 105 565
             Q 128 588 158 598
             Q 188 588 218 606
             Q 260 600 298 618
             Q 340 606 388 618
             Q 432 610 480 606
             Q 528 606 578 614
             Q 622 606 672 614
             Q 716 606 772 614
             Q 822 606 870 606
             Q 908 602 944 630
             Q 970 624 992 612
             Q 962 586 910 578
             Q 846 572 778 578
             Q 706 572 634 578
             Q 556 572 486 578
             Q 408 578 338 572
             Q 268 578 212 566
             Q 152 560 105 565 Z`}
          fill="#16A34A"
          opacity="0.82"
        />

        {/* ================= PULAU MADURA ================= */}
        <path
          d={`M 862 426
             Q 906 408 958 414
             Q 994 426 986 444
             Q 954 456 908 456
             Q 872 448 862 426 Z`}
          fill="#4ADE80"
          stroke="#0F172A"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <text
          x="924"
          y="400"
          textAnchor="middle"
          fontFamily={THEME.font}
          fontWeight="900"
          fontSize="20"
          fill="#0F172A"
        >
          MADURA
        </text>

        {/* ================= VOLCANIC PEAKS ================= */}
        <g fill="#15803D" stroke="#0F172A" strokeWidth="3.5">
          <polygon points="190,545 210,505 230,545" />
          <polygon points="255,540 275,500 295,540" />
          <polygon points="480,545 502,492 524,545" />
          <polygon points="592,540 614,496 636,540" />
          <polygon points="815,545 838,496 861,545" />
          <polygon points="910,552 932,504 954,552" />
        </g>

        {/* ================= TRANSLOCATION ROUTE ARC ================= */}
        {/* Faint planned guide path only shown in Shot 9+ */}
        {!isAtBanten && (
          <path
            d="M 115 535 Q 535 280 955 555"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeDasharray="12 12"
            fill="none"
            opacity="0.6"
          />
        )}

        {/* Active Animated Route Segment (clipped strictly to routeCompletion) */}
        <g clipPath="url(#routeTravelClip)">
          <path
            d="M 115 535 Q 535 280 955 555"
            stroke="#FEF08A"
            strokeWidth="22"
            opacity="0.7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 115 535 Q 535 280 955 555"
            stroke="#EA580C"
            strokeWidth="10"
            strokeDasharray="22 14"
            strokeDashoffset={dashOffset}
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* ================= DISTANCE BANNER (TOP CENTER) ================= */}
        <g transform="translate(540, 125)">
          <rect
            x="-265"
            y="-76"
            width="530"
            height="152"
            rx="22"
            fill="#FFFDF7"
            stroke="#0F172A"
            strokeWidth="4.5"
            filter="drop-shadow(0 8px 0 rgba(15,23,42,0.22))"
          />
          <rect x="-265" y="-76" width="530" height="42" rx="18" fill="#EA580C" />
          <rect x="-265" y="-50" width="530" height="16" fill="#EA580C" />
          <text
            x="0"
            y="-47"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="22"
            fill="#FFFFFF"
            letterSpacing="1"
          >
            RUTE TRANSLOKASI LINTAS JAWA
          </text>
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="900"
            fontSize="44"
            fill="#DC2626"
            letterSpacing="0.5"
          >
            JARAK: ~1.000 KM
          </text>
          <text
            x="0"
            y="54"
            textAnchor="middle"
            fontFamily={THEME.font}
            fontWeight="800"
            fontSize="22"
            fill="#334155"
          >
            BANTEN  →  BANYUWANGI, JATIM
          </text>
        </g>

        {/* ================= PIN 1: TN UJUNG KULON (BANTEN) ================= */}
        <g transform="translate(115, 535)">
          {isAtBanten && (
            <circle
              cx="0"
              cy="0"
              r={30 * pingScale}
              fill="none"
              stroke="#0284C7"
              strokeWidth="5"
              opacity={pingOpacity}
            />
          )}
          <circle cx="0" cy="0" r="20" fill="#0284C7" stroke="#0F172A" strokeWidth="4.5" />
          <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
          <path d="M 0 -18 L 0 -75" stroke="#0F172A" strokeWidth="4.5" />
          <circle cx="0" cy="-75" r="14" fill="#EF4444" stroke="#0F172A" strokeWidth="3.5" />

          {/* Label Card placed with generous left margin (shifted right of pin) */}
          <g transform="translate(75, -118)">
            <rect
              x="-145"
              y="-28"
              width="290"
              height="56"
              rx="14"
              fill="#FFFDF7"
              stroke="#0284C7"
              strokeWidth="3.5"
              filter="drop-shadow(0 4px 0 rgba(15,23,42,0.22))"
            />
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fontFamily={THEME.font}
              fontWeight="900"
              fontSize="24"
              fill="#0284C7"
            >
              TN UJUNG KULON
            </text>
          </g>
        </g>

        {/* ================= PIN 2: TN ALAS PURWO (JATIM) ================= */}
        <g transform="translate(955, 555)">
          {isAtAlasPurwo && (
            <circle
              cx="0"
              cy="0"
              r={30 * pingScale}
              fill="none"
              stroke="#16A34A"
              strokeWidth="5"
              opacity={pingOpacity}
            />
          )}
          <circle cx="0" cy="0" r="20" fill="#16A34A" stroke="#0F172A" strokeWidth="4.5" />
          <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
          <path d="M 0 -18 L 0 -75" stroke="#0F172A" strokeWidth="4.5" />
          <circle cx="0" cy="-75" r="14" fill="#F97316" stroke="#0F172A" strokeWidth="3.5" />

          {/* Label Card shifted left of pin so it NEVER clips at right edge */}
          <g transform="translate(-75, -118)">
            <rect
              x="-145"
              y="-28"
              width="290"
              height="56"
              rx="14"
              fill="#FFFDF7"
              stroke="#16A34A"
              strokeWidth="3.5"
              filter="drop-shadow(0 4px 0 rgba(15,23,42,0.22))"
            />
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fontFamily={THEME.font}
              fontWeight="900"
              fontSize="24"
              fill="#15803D"
            >
              TN ALAS PURWO
            </text>
          </g>
        </g>

        {/* ================= COMPASS ROSE ================= */}
        <g transform="translate(970, 125)">
          <circle cx="0" cy="0" r="42" fill="#FFFDF7" stroke="#0F172A" strokeWidth="3.5" />
          <text x="0" y="-17" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="20" fill="#DC2626">
            U
          </text>
          <text x="0" y="30" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="17" fill="#64748B">
            S
          </text>
          <text x="24" y="6" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="17" fill="#64748B">
            T
          </text>
          <text x="-24" y="6" textAnchor="middle" fontFamily={THEME.font} fontWeight="800" fontSize="17" fill="#64748B">
            B
          </text>
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#0F172A" strokeWidth="2.5" />
        </g>
      </svg>
    </div>
  );
};
