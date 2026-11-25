import React from "react";
import { interpolate } from "remotion";
import { THEME } from "../theme";
import { CalloutLeader } from "./CalloutLeader";
import { OrganicRhino } from "./OrganicRhino";

interface JavaMapLivingProps {
  frame: number;
  progress: number;
  shotId: number;
  mode: "relocation" | "distance_compare";
}

/**
 * Living 2.5D Geographic Map of Java Island, Madura, & Selat Sunda
 * - Rich curved coastline with Pelabuhan Ratu bay, Cilacap, Muria peninsula, Madura, & Blambangan hook
 * - Natural shaded mountain spine & river veins (NO rigid triangles)
 * - Distinct shot viewpoints: West Java zoom -> Aerial route chase -> East Java zoom -> Safety dome -> Dual habitat vignette
 * - Distance compare (Scene 6): Ultra-close Ujung Kulon <15 KM -> Medium pull-out -> Full-island ~1.000 KM contrast
 */
export const JavaMapLiving: React.FC<JavaMapLivingProps> = ({
  frame,
  progress,
  shotId,
  mode,
}) => {
  const waveShift = (frame * 1.6) % 260;
  const ping = 1 + ((Math.sin(frame * 0.24) + 1) * 0.5) * 0.85;
  const pingOp = 0.85 - ((Math.sin(frame * 0.24) + 1) * 0.5) * 0.7;
  const dashFlow = -frame * 6.5;

  // Special Shot 12: Clean Dual-Habitat Split Vignette (avoids repeating the full map view!)
  if (mode === "relocation" && shotId === 12) {
    const archProg = interpolate(progress, [0, 0.7], [0, 1], { extrapolateRight: "clamp" });
    return (
      <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
        <svg
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
        >
          {/* Glowing Insurance Arch connecting Habitat 1 -> Habitat 2 */}
          <path
            d="M 275 560 Q 540 330 805 560"
            stroke="#16A34A"
            strokeWidth="10"
            strokeDasharray="16 10"
            strokeDashoffset={dashFlow}
            fill="none"
            pathLength={1}
            style={{ strokeDasharray: `${archProg} 1` }}
          />
          <polygon points="822,576 785,568 806,540" fill="#16A34A" opacity={archProg} />

          {/* Left Sanctuary Globe: Ujung Kulon */}
          <g transform="translate(275, 740)">
            <circle cx="0" cy="0" r="195" fill="#DCFCE7" stroke="#0284C7" strokeWidth="7" />
            <path d="M -175 45 Q -65 -35 45 25 Q 115 -10 175 40 L 160 100 Q 0 185 -165 95 Z" fill="#22C55E" stroke={THEME.ink} strokeWidth="4" />
            <text x="0" y="-110" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="22" fill="#0284C7">
              HABITAT UTAMA
            </text>
            <text x="0" y="-76" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="27" fill={THEME.ink}>
              UJUNG KULON
            </text>
          </g>

          {/* Right Sanctuary Globe: Alas Purwo (Habitat Kedua) */}
          <g transform={`translate(805, 740) scale(${0.85 + 0.15 * archProg})`}>
            <circle cx="0" cy="0" r="195" fill="#FEF9C3" stroke="#16A34A" strokeWidth="7" />
            <path d="M -175 50 Q -55 -25 55 20 Q 125 -5 175 45 L 160 100 Q 0 185 -165 95 Z" fill="#4ADE80" stroke={THEME.ink} strokeWidth="4" />
            <text x="0" y="-110" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="20" fill="#15803D">
              CADANGAN POPULASI
            </text>
            <text x="0" y="-76" textAnchor="middle" fontFamily={THEME.font} fontWeight="900" fontSize="27" fill={THEME.ink}>
              HABITAT KEDUA
            </text>
          </g>
        </svg>

        {/* Grounded Rhinos inside both sanctuaries */}
        <div style={{ position: "absolute", top: 705, left: 145, zIndex: 20 }}>
          <OrganicRhino frame={frame} scale={0.42} walkSpeed={0.8} pose="walk" />
        </div>
        <div style={{ position: "absolute", top: 705, left: 680, zIndex: 20 }}>
          <OrganicRhino frame={frame + 15} scale={0.42} walkSpeed={0.8} pose="walk" flipX />
        </div>
      </div>
    );
  }

  // Camera ViewBox Choreography across Shots 8, 9, 10, 11 (Relocation) & 24, 25, 26 (Distance Compare)
  let vbX = 0;
  let vbY = 80;
  let vbW = 1400;

  if (mode === "relocation") {
    if (shotId === 8) {
      vbX = interpolate(progress, [0, 1], [15, 80]);
      vbY = interpolate(progress, [0, 1], [135, 130]);
      vbW = interpolate(progress, [0, 1], [740, 800]);
    } else if (shotId === 9) {
      vbX = interpolate(progress, [0, 1], [130, 580]);
      vbY = interpolate(progress, [0, 1], [130, 135]);
      vbW = 800;
    } else if (shotId === 10) {
      vbX = interpolate(progress, [0, 1], [590, 660]);
      vbY = interpolate(progress, [0, 1], [140, 165]);
      vbW = interpolate(progress, [0, 1], [760, 690]);
    } else {
      // Shot 11: Wide Java island + protective safety dome
      vbX = interpolate(progress, [0, 1], [90, 10]);
      vbY = interpolate(progress, [0, 1], [120, 85]);
      vbW = interpolate(progress, [0, 1], [1220, 1380]);
    }
  } else {
    // Scene 6: 3-step progressive pull-out!
    if (shotId === 24) {
      vbX = interpolate(progress, [0, 1], [15, 25]);
      vbY = interpolate(progress, [0, 1], [180, 170]);
      vbW = interpolate(progress, [0, 1], [590, 620]);
    } else if (shotId === 25) {
      vbX = interpolate(progress, [0, 1], [25, 15]);
      vbY = interpolate(progress, [0, 1], [170, 135]);
      vbW = interpolate(progress, [0, 1], [620, 880]);
    } else {
      vbX = interpolate(progress, [0, 0.8], [15, 10], { extrapolateRight: "clamp" });
      vbY = interpolate(progress, [0, 0.8], [135, 85], { extrapolateRight: "clamp" });
      vbW = interpolate(progress, [0, 0.8], [880, 1380], { extrapolateRight: "clamp" });
    }
  }
  const vbH = vbW * 0.78;

  let routeT = 1.0;
  if (mode === "relocation") {
    if (shotId === 8) routeT = 0.08 + progress * 0.14;
    else if (shotId === 9) routeT = 0.22 + progress * 0.65;
    else routeT = 1.0;
  } else {
    routeT = shotId === 24 ? 0 : shotId === 25 ? interpolate(progress, [0, 1], [0.08, 0.45]) : interpolate(progress, [0, 0.85], [0.45, 1.0], { extrapolateRight: "clamp" });
  }

  const longRoutePath = "M 148 395 Q 430 225 715 260 Q 985 295 1218 470";
  const localRoutePath = "M 134 398 Q 152 382 172 390";
  const markerX = interpolate(routeT, [0, 0.5, 1], [148, 700, 1218]);
  const markerY = interpolate(routeT, [0, 0.25, 0.5, 0.75, 1], [395, 295, 260, 325, 470]);

  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #CBEAFF 0%, #7DD3FC 45%, #38BDF8 100%)",
        }}
      />

      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        style={{
          position: "absolute",
          top: 290,
          left: 0,
          width: 1080,
          height: 890,
          overflow: "hidden",
        }}
      >
        <defs>
          <linearGradient id="javaLandGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="55%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>

        {/* Animated Ocean Ripples */}
        <g opacity="0.34" stroke="#F0F9FF" strokeWidth="3.5" fill="none" strokeLinecap="round">
          {[140, 240, 340, 440, 540, 640].map((wy, i) => (
            <path
              key={i}
              d={`M ${-240 + waveShift + (i % 2) * 80} ${wy} Q ${20 + waveShift} ${wy - 16} ${260 + waveShift} ${wy} T ${780 + waveShift} ${wy} T ${1300 + waveShift} ${wy} T ${1820 + waveShift} ${wy}`}
            />
          ))}
        </g>

        {/* Sumatra & Bali */}
        <path
          d="M -60 80 L 95 140 Q 112 185 95 225 Q 65 258 28 242 Q -10 218 -60 210 Z"
          fill="#86EFAC"
          stroke={THEME.ink}
          strokeWidth="4.5"
          opacity="0.85"
        />
        <circle cx="118" cy="282" r="9" fill="#EA580C" stroke={THEME.ink} strokeWidth="3" />
        <path
          d="M 1278 442 Q 1345 418 1420 445 L 1420 515 Q 1335 512 1285 486 Z"
          fill="#86EFAC"
          stroke={THEME.ink}
          strokeWidth="4.5"
          opacity="0.85"
        />

        {/* Pulau Jawa Coastal Shelf & Shadow */}
        <path
          d={`M 140 398 Q 116 408 118 390 Q 138 370 162 362 Q 186 332 195 296 Q 235 288 265 306 Q 302 326 344 306 Q 395 292 436 296 Q 472 328 538 338 Q 605 344 652 356 Q 686 312 728 286 Q 766 308 776 348 Q 842 352 908 358 Q 958 374 996 404 Q 1055 412 1125 398 Q 1192 406 1236 426 Q 1252 468 1242 496 Q 1210 504 1188 486 Q 1110 484 1035 478 Q 955 486 875 476 Q 795 484 720 468 Q 645 458 565 448 Q 495 446 435 426 Q 375 428 315 418 Q 258 438 205 418 Q 168 416 140 398 Z`}
          fill="#0F172A"
          opacity="0.24"
          transform="translate(0, 12)"
        />
        <path
          d={`M 140 398 Q 116 408 118 390 Q 138 370 162 362 Q 186 332 195 296 Q 235 288 265 306 Q 302 326 344 306 Q 395 292 436 296 Q 472 328 538 338 Q 605 344 652 356 Q 686 312 728 286 Q 766 308 776 348 Q 842 352 908 358 Q 958 374 996 404 Q 1055 412 1125 398 Q 1192 406 1236 426 Q 1252 468 1242 496 Q 1210 504 1188 486 Q 1110 484 1035 478 Q 955 486 875 476 Q 795 484 720 468 Q 645 458 565 448 Q 495 446 435 426 Q 375 428 315 418 Q 258 438 205 418 Q 168 416 140 398 Z`}
          fill="url(#javaLandGrad2)"
          stroke={THEME.ink}
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Organic Highland Curves & River Veins */}
        <g fill="#15803D" opacity="0.42">
          <path d="M 245 365 Q 290 338 340 368 Q 390 342 435 376 Q 340 388 245 365 Z" />
          <path d="M 555 392 Q 610 362 665 394 Q 710 366 755 400 Q 655 412 555 392 Z" />
          <path d="M 885 415 Q 945 385 1005 420 Q 1065 388 1135 428 Q 1005 445 885 415 Z" />
        </g>
        <g stroke="#38BDF8" strokeWidth="2.8" fill="none" opacity="0.65" strokeLinecap="round">
          <path d="M 320 358 Q 305 335 312 315" />
          <path d="M 650 382 Q 668 355 658 348" />
          <path d="M 940 402 Q 968 380 990 375" />
        </g>

        {/* Pulau Madura */}
        <path
          d="M 978 332 Q 1025 314 1098 320 Q 1152 326 1168 344 Q 1140 356 1075 352 Q 1005 354 978 332 Z"
          fill="url(#javaLandGrad2)"
          stroke={THEME.ink}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Shot 11: Translucent Safety Dome over Java */}
        {mode === "relocation" && shotId === 11 && (
          <path
            d="M 105 505 Q 700 105 1275 505 Z"
            fill="#FEF08A"
            opacity="0.32"
            stroke="#D97706"
            strokeWidth="4"
            strokeDasharray="14 8"
          />
        )}

        {/* Short Local Route (< 15 KM) */}
        {mode === "distance_compare" && (
          <g>
            <path d={localRoutePath} stroke="#FACC15" strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="134" cy="398" r="6" fill="#0F172A" />
            <circle cx="172" cy="390" r="6" fill="#EA580C" />
            {shotId === 24 && (
              <CalloutLeader
                ax={152}
                ay={386}
                bx={175}
                by={325}
                lx={220}
                ly={325}
                label="< 15 KM (LOKAL)"
                sublabel="KASUS MUSOFA DI UJUNG KULON"
                accent="#D97706"
                progress={progress}
                align="left"
                pillWidth={355}
              />
            )}
          </g>
        )}

        {/* Long Cross-Java Relocation Route */}
        {(mode === "relocation" || shotId >= 25) && (
          <g>
            <path d={longRoutePath} stroke="#FFFFFF" strokeWidth="8" strokeDasharray="12 12" opacity="0.4" fill="none" />
            <path
              d={longRoutePath}
              stroke="#EA580C"
              strokeWidth="8"
              strokeDashoffset={dashFlow}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              style={{ strokeDasharray: `${routeT} 1` }}
            />
            {routeT > 0.05 && routeT < 0.99 && (
              <g transform={`translate(${markerX}, ${markerY})`}>
                <circle cx="0" cy="0" r="18" fill="#FEF08A" opacity="0.7" />
                <circle cx="0" cy="0" r="10" fill="#EA580C" stroke="#FFFFFF" strokeWidth="3" />
              </g>
            )}
          </g>
        )}

        {/* Pins */}
        <g transform="translate(148, 395)">
          <circle cx="0" cy="0" r={16 * ping} fill="#0284C7" opacity={pingOp * 0.45} />
          <circle cx="0" cy="0" r="10" fill="#0284C7" stroke="#FFFFFF" strokeWidth="3.5" />
        </g>
        <g transform="translate(1218, 470)">
          <circle cx="0" cy="0" r={16 * ping} fill="#DC2626" opacity={pingOp * 0.45} />
          <circle cx="0" cy="0" r="10" fill="#DC2626" stroke="#FFFFFF" strokeWidth="3.5" />
        </g>

        {/* Callouts */}
        {mode === "relocation" && shotId === 8 && (
          <CalloutLeader
            ax={148}
            ay={395}
            bx={210}
            by={260}
            lx={260}
            ly={260}
            label="TN UJUNG KULON"
            sublabel="BANTEN (HABITAT ASLI)"
            accent="#0284C7"
            progress={progress}
            align="left"
            pillWidth={320}
          />
        )}
        {mode === "relocation" && shotId === 9 && (
          <CalloutLeader
            ax={markerX}
            ay={markerY}
            bx={markerX}
            by={175}
            lx={markerX}
            ly={175}
            label="LINTAS PULAU JAWA"
            sublabel="BARAT KE TIMUR"
            accent="#EA580C"
            progress={1}
            align="center"
            pillWidth={310}
          />
        )}
        {mode === "relocation" && shotId === 10 && (
          <CalloutLeader
            ax={1218}
            ay={470}
            bx={1125}
            by={305}
            lx={1085}
            ly={305}
            label="TN ALAS PURWO"
            sublabel="BANYUWANGI, JAWA TIMUR"
            accent="#DC2626"
            progress={progress}
            align="right"
            pillWidth={350}
          />
        )}
        {mode === "relocation" && shotId === 11 && (
          <CalloutLeader
            ax={700}
            ay={225}
            bx={700}
            by={155}
            lx={700}
            ly={155}
            label="TUJUAN MULIA: CEGAH PUNAH"
            accent="#D97706"
            progress={progress}
            align="center"
            pillWidth={390}
          />
        )}

        {mode === "distance_compare" && shotId === 25 && (
          <CalloutLeader
            ax={148}
            ay={395}
            bx={220}
            by={265}
            lx={250}
            ly={265}
            label="CUMA DI UJUNG KULON (< 15 KM)"
            sublabel="BANDINGKAN LUAS PULAU JAWA"
            accent="#D97706"
            progress={progress}
            align="left"
            pillWidth={475}
          />
        )}
        {mode === "distance_compare" && shotId === 26 && (
          <g>
            <CalloutLeader
              ax={148}
              ay={395}
              bx={210}
              by={585}
              lx={230}
              ly={585}
              label="LOKAL: < 15 KM"
              accent="#D97706"
              progress={1}
              align="left"
              pillWidth={270}
            />
            <CalloutLeader
              ax={700}
              ay={260}
              bx={700}
              by={170}
              lx={700}
              ly={170}
              label="MENYEBERANG KE JATIM (~1.000 KM)"
              accent="#DC2626"
              progress={progress}
              align="center"
              pillWidth={470}
            />
          </g>
        )}
      </svg>
    </div>
  );
};
