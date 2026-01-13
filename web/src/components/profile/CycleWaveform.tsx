// src/components/profile/CycleWaveform.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  degree: number; // 0..360
  height?: number; // px
  showLabels?: boolean;
  labelColor?: string;
};

function clamp360(n: number) {
  const x = n % 360;
  return x < 0 ? x + 360 : x;
}

// simple sine-like wave across the whole width
function waveY(t01: number) {
  // t01: 0..1
  // peaks at 0.25 (SUMR), trough at 0.75 (WNTR)
  return Math.sin(t01 * Math.PI * 2);
}

export default function CycleWaveform({
  degree,
  height = 86,
  showLabels = true,
  labelColor = "rgba(31,36,26,0.55)",
}: Props) {
  const deg = clamp360(degree);
  const t = deg / 360;

  const { d, markerX01, markerYNorm } = useMemo(() => {
    // Build path in normalized space (0..1) then scale via viewBox
    const samples = 60;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= samples; i++) {
      const x01 = i / samples;
      const y = waveY(x01); // -1..1
      pts.push([x01, y]);
    }

    // Convert points to SVG viewBox coords
    // viewBox: 0..1000 in X, 0..100 in Y
    const W = 1000;
    const H = 100;
    const mid = 50;
    const amp = 26; // wave amplitude in viewBox units
    const toXY = (x01: number, y: number) => [x01 * W, mid - y * amp] as const;

    const [mx, my] = toXY(t, waveY(t));

    let path = "";
    pts.forEach(([x01, y], idx) => {
      const [x, yy] = toXY(x01, y);
      path += idx === 0 ? `M ${x.toFixed(1)} ${yy.toFixed(1)}` : ` L ${x.toFixed(1)} ${yy.toFixed(1)}`;
    });

    return {
      d: path,
      markerX01: t,
      markerYNorm: my, // already in viewBox Y
    };
  }, [t]);

  // marker x in viewBox
  const markerX = (markerX01 * 1000).toFixed(1);

  return (
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl border"
        style={{
          borderColor: "rgba(31,36,26,0.14)",
          background: "rgba(244,235,221,0.42)",
        }}
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div
              className="text-[11px] tracking-[0.22em] uppercase"
              style={{ color: "rgba(31,36,26,0.55)" }}
            >
              Cycle Waveform
            </div>
            <div className="text-[12px]" style={{ color: "rgba(31,36,26,0.78)" }}>
              {deg.toFixed(2)}°
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <svg
            viewBox="0 0 1000 100"
            width="100%"
            height={height}
            role="img"
            aria-label={`Cycle waveform marker at ${deg.toFixed(2)} degrees`}
          >
            {/* soft baseline */}
            <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(31,36,26,0.10)" strokeWidth="2" />

            {/* waveform */}
            <path d={d} fill="none" stroke="rgba(31,36,26,0.55)" strokeWidth="6" strokeLinecap="round" />

            {/* marker hairline */}
            <line
              x1={markerX}
              y1="6"
              x2={markerX}
              y2="94"
              stroke="rgba(31,36,26,0.22)"
              strokeWidth="2"
            />

            {/* marker dot */}
            <circle
              cx={markerX}
              cy={markerYNorm}
              r="9"
              fill="rgba(31,36,26,0.90)"
            />
            <circle
              cx={markerX}
              cy={markerYNorm}
              r="14"
              fill="rgba(31,36,26,0.08)"
            />
          </svg>

          {showLabels && (
            <div className="mt-1 grid grid-cols-4 text-[10px] tracking-[0.22em] uppercase">
              <div style={{ color: labelColor }}>SPRG</div>
              <div className="text-center" style={{ color: labelColor }}>SUMR</div>
              <div className="text-center" style={{ color: labelColor }}>FALL</div>
              <div className="text-right" style={{ color: labelColor }}>WNTR</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
